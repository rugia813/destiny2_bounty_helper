<template>
  <div id="app">
    <Login
      v-if="!isLoggedIn || loadingInitialData"
      :member="member"
      :loadingInitialData="loadingInitialData"
      :isDevMode="isDevMode"
      @handle-code="handleCode"
    />

    <template v-else>
      <Header
        :characterId="member.characterId"
        :characters="characters"
        :refreshing="refreshing"
        :activities="activities"
        :keywords="keywords"
        @character-change="characterId => member.changeInventory(characterId)"
        @refresh="refresh"
        @update:activities="activities = $event"
        @update:keywords="keywords = $event"
        @reset-activities="resetConfAct"
        @reset-keywords="resetConfKeywords"
      />

      <div class="main-content">
        <BountyTable
          :categorizedBounties="categorizedBounties"
          :keywords="keywords"
          :filteredActivities="filteredActivities"
          :filteredKeywords="filteredKeywords"
          :activitiesHidden="activitiesHidden"
          @hide-activity="hideActivity"
          @unhide-all="unhideAllActivities"
        />
      </div>
    </template>
  </div>
</template>

<script>
import './App.scss';
import Login from './components/Login.vue';
import Header from './components/Header.vue';
import BountyTable from './components/BountyTable.vue';
import Manifest from "./Manifest";
import Member from "./Member";
import * as api from "./api";
import * as cookie from "./cookie";
import { DestinyRecordState } from 'bungie-api-ts/destiny2';
import {
  categorizeActivity,
  findKeywordIndex,
  initializeBountiesStructure,
  processObjectives,
  createChallengeObject
} from './utils/bountyUtils';
import {
  saveToStorage,
  loadFromStorage,
  arrayValidator
} from './utils/storageUtils';
import {
  getAuthParams,
  setupAuthPopupHandler,
  launchAuthPopup,
  cleanupAuthRedirect
} from './utils/authUtils';

// Default keywords and activities (consider moving to a config file?)
const defaultKeywords = [
  'Submachine Gun', 'Machine Gun', 'Grenade Launcher', 'Sword', 'Linear Fusion Rifle', 'Fusion Rifle', 'Shotgun', 'Glaive',
  'Hand Cannon', 'Sidearm', 'Pulse Rifle', 'Scout Rifle', 'Sniper Rifle', 'Auto Rifle', 'Rocket Launcher', 'Bow', 'Trace Rifle',
  'Solar', 'Void', 'Arc', 'Stasis', 'Strand', // Added Strand
  'Kinetic', 'Energy', 'Power', // Added Power
  'Scorn', 'Fallen', 'Cabal', 'Vex', 'Taken', 'Hive', 'Guardian', // Added Guardian
  'Super', 'Orb', 'Ability', // Added Ability
  'melee', 'grenade', 'finisher',
  'precision', 'public event', 'Lost Sector', 'Crucible', 'Gambit', 'Strike', 'Nightfall', // Added activities
]

const defaultActivities = [
  'strikes',
  'crucible',
  'gambit',
  'throneworld',
  'neomuna',
  'seasonal',
  'xur',
  'war_table',
  'challenges', // New category for seasonal challenges
]

const SEASONAL_CHALLENGE_NODE_HASH = 3443694067;

export default {
  name: 'App',
  components: {
    Login,
    Header,
    BountyTable
  },
  data() {
    return {
      member: undefined,
      activities: defaultActivities.slice(),
      keywords: defaultKeywords.slice(),
      refreshing: false,
      loadingInitialData: true,
      isDevMode: process.env.NODE_ENV === 'development',
      activitiesHidden: {}
    }
  },
  created() {
    const { code } = getAuthParams();
    if (code && window.opener && window.opener.setCode) {
      try {
        window.opener.setCode(code);
      } catch (e) {
        console.warn("Opener might have closed before code could be sent.");
      }
      requestAnimationFrame(() => window.close());
    }

    if (this.dev) {
      // Expose globals for debugging
      Object.assign(window, {
        app: this,
        api,
        manifest: Manifest,
        t: this.t,
        getRecordDef: this.getRecordDef,
        getPresentationNodeDef: this.getPresentationNodeDef
      });
    }
  },
  async mounted() {
    const manifestPromise = Manifest.fetchManifest();

    // Load config from storage
    this.activities = loadFromStorage('activities', arrayValidator, defaultActivities.slice());
    this.keywords = loadFromStorage('keywords', arrayValidator, defaultKeywords.slice());

    await manifestPromise;
    await this.fetchTokenAndProfile();
    this.loadingInitialData = false;
  },
  methods: {
    async reloadManifest() {
      await Manifest.clearCache();
      await Manifest.fetchManifest();
      await this.fetchTokenAndProfile();
    },
    getAutho() {
      setupAuthPopupHandler(this.handleCode.bind(this));
      const popup = launchAuthPopup();
      if (!popup) {
        alert("Popup blocked. Please allow popups for this site.");
      }
    },
    // Manifest accessors bound to component instance
    t(hash) {
      return Manifest.t(hash);
    },
    getRecordDef(hash) {
      return Manifest.getRecordDef(hash);
    },
    getPresentationNodeDef(hash) {
        return Manifest.getPresentationNodeDef(hash);
    },
     getObjectiveDef(hash) {
        return Manifest.getObjectiveDef(hash);
    },
    async handleCode(code) {
      this.loadingInitialData = true; // Show loading indicator
      try {
        const tokenResponse = await api.getToken(code);
        if (tokenResponse.success) {
          // Token and memberId should now be stored in cookies by api.getToken
          // Proceed to fetch profile data
          await this.fetchTokenAndProfile();
        } else {
          // api.getToken failed and should have cleared cookies
          console.error("Failed to get token:", tokenResponse.error);
          alert(`Login failed: ${tokenResponse.error || 'Unknown error'}. Please try again.`);
          // Ensure UI updates if needed (e.g., hide loading indicator)
          this.$forceUpdate();
        }
      } catch (error) {
        // Catch errors from fetchTokenAndProfile or other unexpected issues
        console.error("Error during login process:", error);
        alert("An unexpected error occurred during login. Please try again.");
        cookie.clearToken(); // Ensure tokens are cleared on unexpected errors
        this.$forceUpdate();
      } finally {
        this.loadingInitialData = false;
         // Clean up URL regardless of success/failure
         window.history.replaceState({}, document.title, window.location.pathname);
      }
    },
    // Combined function to check token and fetch profile data
    async fetchTokenAndProfile() {
      const token = cookie.getToken();
      const memberId = cookie.getMemberId(); // Bungie.net membership ID

      if (token && memberId) {
        if (!this.member) {
            this.member = new Member(memberId);
        }
        try {
          const isSuccess = await this.member.fetchProfileData(); // Use the new method
          if (!isSuccess) {
            await this.refreshAuthToken(true); // Attempt refresh and reload profile
          } else {
             this.$forceUpdate(); // Ensure reactivity updates
          }
        } catch (error) {
          console.error("Error during initial profile fetch:", error);
          // Attempt refresh if it's an auth error
          if (error.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired || error.ErrorCode === PlatformErrorCodes.WebAuthRequired) {
               await this.refreshAuthToken(true);
          } else {
              cookie.clearToken(); // Clear token for other errors
              this.$forceUpdate(); // Update UI to show login
              alert('Failed to load profile data. Please try logging in again.');
          }
        }
      } else {
        const refreshToken = cookie.getRefreshToken();
        if (refreshToken) {
          await this.refreshAuthToken(true); // Attempt refresh and load profile
        } else {
          this.loadingInitialData = false; // Stop loading indicator if no tokens
        }
      }
    },
    getToken() {
      return cookie.getToken();
    },
    getRefreshToken() {
      return cookie.getRefreshToken();
    },
    // Updated refresh method
    async refresh() {
      if (this.refreshing || !this.member) return;

      this.refreshing = true;
      try {
        const isSuccess = await this.member.fetchProfileData(); // Use the new method
         if (!isSuccess) {
            await this.refreshAuthToken(true); // Refresh token and re-fetch profile
         } else {
             this.$forceUpdate(); // Ensure reactivity updates
         }
      } catch (error) {
         console.error("Error during manual refresh:", error);
         // Attempt refresh if it's an auth error
         if (error.ErrorCode === PlatformErrorCodes.AccessTokenHasExpired || error.ErrorCode === PlatformErrorCodes.WebAuthRequired) {
              await this.refreshAuthToken(true);
         } else {
             alert('Failed to refresh data. You might need to log in again.');
             cookie.clearToken();
             this.$forceUpdate();
         }
      } finally {
        this.refreshing = false;
      }
    },
    // Updated refreshAuthToken
    async refreshAuthToken(fetchProfileAfter = false) {
      const refreshToken = cookie.getRefreshToken();
      if (!refreshToken) {
        cookie.clearToken(); // Ensure all tokens are cleared
        this.$forceUpdate(); // Update UI to show login prompt
        return;
      }

      try {
        const refreshResponse = await api.refresh(refreshToken);

        if (refreshResponse.success) {
          // Token and memberId updated in cookies by api.refresh
          if (fetchProfileAfter) {
            const refreshedMemberId = cookie.getMemberId(); // Get potentially updated memberId from cookie

            if (refreshedMemberId) {
                // If memberId exists in cookie (happy path)
                if (!this.member || this.member.membershipId !== refreshedMemberId) {
                    console.log("Membership ID changed or member instance missing, creating new Member instance.");
                    this.member = new Member(refreshedMemberId); // Create/update member instance
                }
                // Proceed to fetch profile data with the correct member instance
                try {
                    await this.member.fetchProfileData();
                    this.$forceUpdate(); // Update UI
                } catch (profileError) {
                    console.error("Profile fetch failed AFTER successful token refresh:", profileError);
                    // If profile fetch fails even with new token/memberId, clear tokens
                    cookie.clearToken();
                    this.$forceUpdate();
                    alert("Failed to load profile data after refreshing session. Please log in again.");
                }
            } else {
                // If memberId is MISSING in cookie after refresh (error condition)
                console.warn("Membership ID missing from cookie after token refresh. Attempting profile fetch with existing member data.");
                if (this.member) {
                    // Try fetching with the existing member instance as a fallback
                    try {
                        await this.member.fetchProfileData();
                        this.$forceUpdate(); // Update UI if successful
                    } catch (profileErrorFallback) {
                        console.error("Fallback profile fetch failed after missing memberId post-refresh:", profileErrorFallback);
                        // If fallback fetch also fails, clear tokens
                        cookie.clearToken();
                        this.$forceUpdate();
                        alert("Failed to load profile data after refreshing session (missing membership ID). Please log in again.");
                    }
                } else {
                    // No existing member instance to fall back on
                    console.error("Membership ID missing after token refresh and no existing member instance found.");
                    cookie.clearToken();
                    this.$forceUpdate();
                    alert("Critical error during login refresh. Please log in again.");
                }
            }
          } else {
               // If fetchProfileAfter is false, just update UI
               this.$forceUpdate();
          }
        } else {
          // api.refresh failed
          console.error('Token refresh failed:', refreshResponse.error);
          cookie.clearToken(); // Clear all tokens on refresh failure
          this.$forceUpdate(); // Update UI to show login prompt
          // No need to throw error here, failure is handled
        }
      } catch (error) {
         // Catch unexpected errors during the refresh process itself (e.g., network issues)
        console.error('Unexpected error during token refresh process:', error);
        cookie.clearToken(); // Ensure cleanup
        this.$forceUpdate();
        // Optionally re-throw if needed by the caller context (like initial load)
        // throw error;
      }
    },
    resetConfAct() {
      this.activities = defaultActivities.slice();
      saveToStorage('activities', this.activities);
    },
    resetConfKeywords() {
      this.keywords = defaultKeywords.slice();
      saveToStorage('keywords', this.keywords);
    },
    hideActivity(category) {
      this.activitiesHidden = { ...this.activitiesHidden, [category]: true };
    },
    unhideAllActivities() {
      this.activitiesHidden = {};
    }
  },
  computed: {
    dev() {
      return import.meta.env.DEV;
    },
    isLoggedIn() {
        // Considered logged in if member object exists and has character data
        return !!this.member && !!this.member.characters && Object.keys(this.member.characters).length > 0;
    },
    inventory() {
      // Use optional chaining for safety
      return this.member?.inventory || [];
    },
    bounties() {
      // Filter inventory items that look like bounties
      return this.inventory.filter(item => {
        const itemDef = this.t(item.itemHash);
        // Basic check: has objectives, isn't an Engram (cat 38), isn't Currency (cat 1)
        // Adjust category checks as needed based on manifest inspection
        return itemDef &&
               itemDef.objectives &&
               itemDef.objectives.objectiveHashes?.length > 0 &&
               !itemDef.itemCategoryHashes?.includes(38) && // Engram
               !itemDef.itemCategoryHashes?.includes(1) && // Currency
               itemDef.inventory?.stackUniqueLabel?.includes('bounties'); // Good indicator
      });
    },
    characters() {
      return this.member?.characters || {};
    },
    // Bounty and challenge categorization logic
    categorizedBounties() {
      const bounties = this.bounties;
      const challenges = this.seasonalChallenges;
      const result = initializeBountiesStructure(this.activities, this.keywords.length + 1);
      const count = result.count;

      // Process bounties
      bounties.forEach(item => {
        const itemDef = this.t(item.itemHash);
        if (!itemDef) return;

        const kwIdx = findKeywordIndex(itemDef.displayProperties?.description, this.keywords);
        const category = categorizeActivity(itemDef.displayProperties?.description);
        const bountyItem = {
          ...item,
          isBounty: true,
          definition: itemDef
        };

        if (category !== 'misc') {
          result[category][kwIdx].push(bountyItem);
        } else {
          result.misc[kwIdx].push(bountyItem);
        }
        count[kwIdx]++;
      });

      // Process challenges
      challenges.forEach(challenge => {
        if (challenge.complete && !challenge.state?.redeemable) return;

        const kwIdx = findKeywordIndex(challenge.description, this.keywords);
        const category = categorizeActivity(challenge.description || challenge.name);
        const challengeItem = {
          ...challenge,
          isChallenge: true,
          itemHash: challenge.hash
        };

        if (category !== 'misc') {
          if (!result[category]) {
            result[category] = new Array(this.keywords.length + 1).fill(null).map(() => []);
          }
          result[category][kwIdx].push(challengeItem);
        } else {
          result.misc[kwIdx].push(challengeItem);
        }
        count[kwIdx]++;
      });

      return result;
    },
    filteredActivities() {
        // Filter activities that have bounties and are not hidden
        const activeActs = this.activities
            .filter(act => {
                const category = this.categorizedBounties[act.toLowerCase()];
                // Check if any keyword list within the activity category has items and it's not hidden
                return category &&
                       category.some(kwList => kwList.length > 0) &&
                       !this.activitiesHidden[act];
            });

        // Check if misc has any bounties and is not hidden
        const miscHasBounties = this.categorizedBounties.misc?.some(kwList => kwList.length > 0);
        const showMisc = miscHasBounties && !this.activitiesHidden['MISC'];

        return [
            ...activeActs,
            ...(showMisc ? ['MISC'] : [])
        ];
    },
    filteredKeywords() {
      const count = this.categorizedBounties.count || [];
      return this.keywords.filter((kw, i) => count[i] > 0); // Show only keywords with bounties
    },
    // Computed property for Seasonal Challenges
    seasonalChallenges() {
        if (!Manifest.ready || !this.member || !this.member.profileRecords) {
            return [];
        }

        const seasonalNode = Manifest.getPresentationNodeDef(SEASONAL_CHALLENGE_NODE_HASH) ||
                           Manifest.getPresentationNodeDef(WISH_SEASON_HASH);

        if (!seasonalNode) {
            console.warn("Could not find seasonal challenges node");
            return [];
        }

        const challengeHashes = Manifest.getRecordHashesFromNode(seasonalNode.hash);
        if (!challengeHashes?.length) {
            console.warn("No record hashes found under the Seasonal Challenge node:", seasonalNode.hash);
            return [];
        }

        const profileRecords = this.member.profileRecords?.records || {};
        const characterRecords = Object.values(this.member.characterRecords || {})
            .reduce((acc, char) => ({ ...acc, ...char.records }), {});

        return challengeHashes
            .map(hash => {
                const recordDef = this.getRecordDef(hash);
                if (!recordDef) return null;

                const record = profileRecords[hash] || characterRecords[hash] || {
                    state: 0,
                    objectives: recordDef.objectives?.map(obj => ({
                        objectiveHash: obj.objectiveHash,
                        complete: false,
                        progress: 0
                    })) || []
                };

                if (!record) return null;

                const objectives = processObjectives(record, recordDef, this.getObjectiveDef);
                const state = {
                    objectiveNotCompleted: !!(record.state & DestinyRecordState.ObjectiveNotCompleted),
                    recordRedeemed: !!(record.state & DestinyRecordState.RecordRedeemed),
                    isRedeemable: !!(record.state & DestinyRecordState.Redeemable)
                };

                const isActive = state.objectiveNotCompleted || state.isRedeemable;
                if (!isActive) return null;

                return createChallengeObject(record, recordDef, state, objectives);
            })
            .filter(Boolean);
    }
  }
}
</script>
