<template>
  <div id="app">
    <div class="login-container" v-if="!isLoggedIn || loadingInitialData">
      <!-- DEV code input -->
      <input v-if="isDevMode" @blur="e => handleCode(e.target.value)" placeholder="paste code from qs here" />

      <!-- Login -->
      <div class="loginPanel" v-if="!getToken() && !getRefreshToken() && !loadingInitialData">
        <div class="loginBtnPanel">
          <button
            @click="getAutho"
            class="loginBtn"
          >
            Login with Bungie.net
          </button>
        </div>
        <p>This app helps you to do similar bounties at the same time, by categorizing them by weapon types, element types and activites.</p>
        Example:
        <div class="loginImgPanel">
          <img src="https://i.imgur.com/rSHR0q7.png" />
        </div>
      </div>

      <!-- loading -->
      <div class="loading" v-else>
        Loading Manifest and Profile Data...
        <span v-if="!Manifest.ready">(Manifest...)</span>
        <span v-if="!member || member.loading">(Profile...)</span>
      </div>
    </div>

    <template v-else>
      <!-- Characters -->
      <div class="character-row">
        <CharSelect
          :activeId="member.characterId"
          :characters="characters"
          @change="characterId => member.changeInventory(characterId)"
        />
          <div class="controls">
            <!-- Refresh -->
            <span class="refresh" @click="refresh">{{refreshing ? 'Refreshing' : 'Refresh'}}</span>

            <!-- Config -->
            <div class="config-panel">
              Config
              <div class="bubble">
                <div>
                  Activities
                  <span tabindex="0" class="hint" title="hover over a bounty to see its full key, enter the segment that represents the activity.">❔</span>
                  <span class="reset" @click="resetConfAct()">reset</span>
                  <textarea ref="actConfig" @change="parseActivities" :value="activities.join(',')"></textarea>
                </div>
                <div>
                  Keywords
                  <span tabindex="0" class="hint" title="keywords to be searched in bounties' description.">❔</span>
                  <span class="reset" @click="resetConfKeywords()">reset</span>
                  <textarea ref="actKeywords" @change="parseKeywords" :value="keywords.join(',')"></textarea>
                </div>
              </div>
            </div>
          </div>

        <div class="right-panel">

          <!-- Contact -->
          <div class="contact" title="Github">
            <a href="https://github.com/rugia813/destiny2_bounty_helper" target="tab" alt="Link to source code at Github">GitHub</a>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Bounty Table -->
        <div class="bounties section">
          <h2>
            Bounties & Challenges
          </h2>
          <table v-if="categorizedBounties.count.some(c => c > 0)">
            <thead>
              <tr>
                <th
                  style="white-space: nowrap;"
                  :set="len = Object.keys(activitiesHidden).length"
                  @click="activitiesHidden = {}"
                >
                  <span class="btn-unhide">Unhide</span>
                  (<span :style="{color: len ? 'red' : 'silver'}">{{len}}</span>)
                </th>
                <th v-for="kw in [...filteredKeywords]" :key="kw">
                  {{kw}}
                  <span v-if="symbols[kw]" :style="{color: symbols[kw].color}">{{symbols[kw].symbol}}</span>
                </th>
                <th v-if="categorizedBounties.count[keywords.length]">uncategorized</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(category, i) in filteredActivities" :key="category">
                <td>
                  <div class="category-title">{{ category }}</div>
                  <div
                    v-if="i !== filteredActivities.length - 1"
                    class="btn-hide"
                    @click="() => (activitiesHidden = {...activitiesHidden, [category]: true})"
                  >❌</div>
                </td>
                <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx]" :key="kwIdx">
                  <Bounty
                    v-for="(item) in categorizedBounties[category.toLowerCase()][kwIdx]"
                    :key="item.isChallenge ? item.hash : item.itemInstanceId"
                    :item="item"
                    :keyword="kw"
                  />
                </td>
                <td v-if="categorizedBounties.count[keywords.length]" class="lastTd">
                   <Bounty
                    v-for="(item) in categorizedBounties[category.toLowerCase()][keywords.length]"
                    :key="item.isChallenge ? item.hash : item.itemInstanceId"
                    :item="item"
                    keyword=""
                  />
                </td>
              </tr>
            </tbody>
          </table>
           <div v-else>No active bounties or challenges found for this character.</div>
        </div>

      </div>

    </template>
  </div>
</template>

<script>
import './App.scss'; // Import the styles
import Bounty from './components/Bounty.vue'
import * as api from "./api";
import * as cookie from "./cookie";
import Manifest from "./Manifest"; // Updated Manifest
import Member from "./Member"; // Updated Member
import CharSelect from './components/CharSelect.vue'
import {symbols} from './symbols'
import { DestinyRecordState, PlatformErrorCodes } from 'bungie-api-ts/destiny2';

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
    Bounty,
    CharSelect,
  },
  data() {
    return {
      member: undefined,
      activities: defaultActivities.slice(),
      activitiesHidden: {},
      keywords: defaultKeywords.slice(),
      refreshing: false,
      loadingInitialData: true, // Track initial load state
      symbols,
      Manifest, // Expose Manifest to template for readiness check
      isDevMode: process.env.NODE_ENV === 'development' // Enable debug features in development
    }
  },
  created() {
    // when redirected back from authorization page
    const code = this.getCode()
    if (code && window.opener && window.opener.setCode) {
      // Prevent race condition if opener closes too fast
      try {
        window.opener.setCode(code);
      } catch (e) {
        // console.warn("Opener might have closed before code could be sent.");
      }
      // Use requestAnimationFrame to ensure opener has time to process
      requestAnimationFrame(() => {
        window.close();
      });
    }

    // Expose globals for debugging if needed (consider removing in production)
    window['app'] = this;
    window['api'] = api;
    window['manifest'] = Manifest;
    window['t'] = this.t; // Use component method for manifest access
    window['getRecordDef'] = this.getRecordDef;
    window['getPresentationNodeDef'] = this.getPresentationNodeDef;
  },
  async mounted() {
    // Start fetching manifest immediately
    const manifestPromise = Manifest.fetchManifest();

    // Load config from localStorage
    this.activities = this.loadConfig('activities') || defaultActivities.slice();
    this.keywords = this.loadConfig('keywords') || defaultKeywords.slice();

    // Wait for manifest before attempting to fetch token/profile
    await manifestPromise;

    // Now attempt to fetch token and profile data
    await this.fetchTokenAndProfile();
    this.loadingInitialData = false; // Initial load attempt finished
  },
  methods: {
    async reloadManifest() {
      await Manifest.clearCache();
      await Manifest.fetchManifest();
      await this.fetchTokenAndProfile();
    },
    getAutho() {
      // Ensure setCode is available on window before opening popup
      window.setCode = this.handleCode.bind(this);
      const popup = api.authorize();
      if (!popup) {
        alert("Popup blocked. Please allow popups for this site.");
      }
    },
    getCode() {
      const params = new URLSearchParams(window.location.search);
      return params.get('code');
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
        const data = tokenResponse?.data;

        if (data?.access_token && data?.membership_id) {
          // Store token and membership ID in cookies
          cookie.setToken(data.access_token);
          cookie.setMemberId(data.membership_id);
          if (data.refresh_token) {
            cookie.setRefreshToken(data.refresh_token, 90); // 90 days expiry
          }
          // Proceed to fetch profile data
          await this.fetchTokenAndProfile();
        } else {
          console.error("Failed to get token:", data?.error_description || 'Invalid response');
          cookie.clearToken(); // Clear any partial data
          alert(`Login failed: ${data?.error_description || 'Invalid response'}. Please try again.`);
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
          // Check if error is an auth error
          if (error.error_code === 99 || error.error_code === 2101) { // 99: WebAuthRequired, 2101: AccessTokenHasExpired
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
         // Check if error is an auth error
         if (error.error_code === 99 || error.error_code === 2101) { // 99: WebAuthRequired, 2101: AccessTokenHasExpired
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
        cookie.clearToken();
        this.$forceUpdate();
        return;
      }

      try {
        const refreshResponse = await api.refresh(refreshToken);
        const data = refreshResponse?.data;

        if (data?.access_token && data?.membership_id) {
          // Store new tokens
          cookie.setToken(data.access_token);
          cookie.setMemberId(data.membership_id);
          if (data.refresh_token) {
            cookie.setRefreshToken(data.refresh_token, 90);
          }

          if (fetchProfileAfter) {
            // Update member instance if needed
            const refreshedMemberId = data.membership_id; // Use the ID from the refresh response data
            if (refreshedMemberId) {
                // If memberId exists in response data (happy path)
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
                 // This case shouldn't happen if data.membership_id check passed above
                 console.error("Membership ID missing in refresh response data, though access token was present.");
                 cookie.clearToken();
                 this.$forceUpdate();
                 alert("Critical error during login refresh (missing ID). Please log in again.");
            }
          } else {
               // If fetchProfileAfter is false, just update UI
               this.$forceUpdate();
          }
        } else {
          // api.refresh failed
          // Use data.error_description from the response
          console.error('Token refresh failed:', data?.error_description || 'Invalid response');
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
    // Config methods remain largely the same
    parseActivities(e) {
      const value = e.target.value.trim();
      this.activities = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.saveConfig('activities', this.activities);
    },
    parseKeywords(e) {
      const value = e.target.value.trim();
      this.keywords = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.saveConfig('keywords', this.keywords);
    },
    resetConfAct() {
      this.activities = defaultActivities.slice();
      this.saveConfig('activities', this.activities);
    },
    resetConfKeywords() {
      this.keywords = defaultKeywords.slice();
      this.saveConfig('keywords', this.keywords);
    },
    saveConfig(name, val) {
      // Ensure value is stringified correctly (especially for arrays)
      localStorage.setItem(name, JSON.stringify(val));
    },
    loadConfig(name) {
      const str = localStorage.getItem(name);
      try {
          // Parse the stored JSON string
          const parsed = str ? JSON.parse(str) : null;
          // Ensure it's an array before returning
          return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
          console.error(`Error loading config for ${name}:`, e);
          return null; // Return null or default if parsing fails
      }
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
      const activitiesMap = {};
      const count = new Array(this.keywords.length + 1).fill(0);

      // Helper to categorize by description or name
      const categorize = (text) => {
        if (!text) return 'misc';
        text = text.toLowerCase();
        // Order matters - check more specific categories first
        if (text.includes('crucible')) return 'crucible';
        if (text.includes('gambit')) return 'gambit';
        if (text.includes('strike') || text.includes('vanguard')) return 'strikes';
        if (text.includes('throne world') || text.includes('savathun')) return 'throneworld';
        if (text.includes('neomuna')) return 'neomuna';
        if (text.includes('seasonal') || text.includes('ritual')) return 'seasonal';
        return 'misc';
      };

      // Helper to get keywords from text
      const getKeywords = (text) => {
        if (!text) return this.keywords.length;
        text = text.toLowerCase();
        for (let i = 0; i < this.keywords.length; i++) {
          if (text.includes(this.keywords[i].toLowerCase())) {
            return i;
          }
        }
        return this.keywords.length;
      };

      // Initialize categories
      this.activities.forEach(act => {
        activitiesMap[act.toLowerCase()] = new Array(this.keywords.length + 1).fill(null).map(() => []);
      });
      const miscCategory = new Array(this.keywords.length + 1).fill(null).map(() => []);

      // Process bounties
      bounties.forEach(item => {
        const itemDef = this.t(item.itemHash);
        if (!itemDef) return;

        const kwIdx = getKeywords(itemDef.displayProperties?.description);
        const category = categorize(itemDef.displayProperties?.description);

        if (category !== 'misc') {
          activitiesMap[category][kwIdx].push({
            ...item,
            isBounty: true,
            definition: itemDef
          });
        } else {
          miscCategory[kwIdx].push({
            ...item,
            isBounty: true,
            definition: itemDef
          });
        }
        count[kwIdx]++;
      });

      // Process challenges
      challenges.forEach(challenge => {
        // Skip completed challenges unless they're redeemable
        if (challenge.complete && !challenge.state?.redeemable) return;

        const kwIdx = getKeywords(challenge.description);
        const category = categorize(challenge.description || challenge.name);

        // Create a bounty-like challenge object
        const challengeItem = {
          ...challenge,
          isChallenge: true,
          itemHash: challenge.hash // Ensure itemHash is present for keying if needed
        };

        if (category !== 'misc') {
          // Ensure the category exists before pushing
          if (!activitiesMap[category]) {
             activitiesMap[category] = new Array(this.keywords.length + 1).fill(null).map(() => []);
          }
          activitiesMap[category][kwIdx].push(challengeItem);
        } else {
          miscCategory[kwIdx].push(challengeItem);
        }
        count[kwIdx]++;
      });

      // Combine activitiesMap and miscCategory
      const result = {};
      this.activities.forEach(act => {
        result[act.toLowerCase()] = activitiesMap[act.toLowerCase()];
      });
      result['misc'] = miscCategory;
      result['count'] = count;

      return result;
    },
    filteredActivities() {
        // Filter activities that have bounties and are not hidden
        const activeActs = this.activities
            .filter(act => !this.activitiesHidden[act])
            .filter(act => {
                const category = this.categorizedBounties[act.toLowerCase()];
                // Check if any keyword list within the activity category has items
                return category && category.some(kwList => kwList.length > 0);
            });

        // Check if misc has any bounties
        const miscHasBounties = this.categorizedBounties.misc?.some(kwList => kwList.length > 0);

        return [
            ...activeActs,
            ...(miscHasBounties ? ['MISC'] : []) // Add MISC only if it has content
        ];
    },
    filteredKeywords() {
      const count = this.categorizedBounties.count || [];
      return this.keywords.filter((kw, i) => count[i] > 0); // Show only keywords with bounties
    },
    // Computed property for Seasonal Challenges
    seasonalChallenges() {
        if (!Manifest.ready || !this.member || !this.member.profileRecords) {
            return []; // Not ready yet
        }

        // First try to find the correct node
        const WISH_SEASON_HASH = 2475171439; // Season of the Wish seasonal challenges root
        const seasonalNode = Manifest.getPresentationNodeDef(SEASONAL_CHALLENGE_NODE_HASH) ||
                            Manifest.getPresentationNodeDef(WISH_SEASON_HASH);

        if (!seasonalNode) {
            console.warn("Could not find seasonal challenges node");
            return [];
        }

        // Use the hash from the node we actually found
        const challengeHashes = Manifest.getRecordHashesFromNode(seasonalNode.hash);
        if (!challengeHashes || challengeHashes.length === 0) {
            console.warn("No record hashes found under the Seasonal Challenge node:", seasonalNode.hash);
            return [];
        }

        // Try to get records from profile first, then fall back to character records
        const profileRecords = this.member.profileRecords?.records || {};
        console.log('Raw profileRecords:', this.member.profileRecords); // Added logging

        // Combine records from all characters
        const characterRecords = {};
        if (this.member.characterRecords) {
            console.log('Raw characterRecords:', this.member.characterRecords); // Added logging
            // Get the currently selected character's records first
            const currentCharacter = this.member.characterRecords[this.member.characterId];
            if (currentCharacter?.records) {
                Object.assign(characterRecords, currentCharacter.records);
            }

            // Then get records from other characters if needed
            Object.entries(this.member.characterRecords).forEach(([charId, char]) => {
                if (charId !== this.member.characterId && char.records) {
                    Object.assign(characterRecords, char.records);
                }
            });
        }

        console.log('Records sources:', {
            profileRecordsCount: Object.keys(profileRecords).length,
            characterRecordsCount: Object.keys(characterRecords).length,
            characters: Object.keys(this.member.characterRecords || {})
        });

        let challengesLogged = 0; // Counter for logging
        const MAX_CHALLENGES_TO_LOG = 3; // Log details for the first few challenges

        const challenges = challengeHashes
            .map(hash => {
                const recordDef = this.getRecordDef(hash);
                // Skip only if we don't have a definition
                if (!recordDef) {
                    return null;
                }

                // Look for progress in both profile and character records
                const record = profileRecords[hash] || characterRecords[hash] || {
                    state: 0,
                    objectives: recordDef.objectives?.map(obj => ({
                        objectiveHash: obj.objectiveHash,
                        complete: false,
                        progress: 0
                    })) || []
                };

                // Map objectives using API data as the source and enrich with manifest definitions
                const objectives = (record.objectives || []).map(apiObjective => {
                    // Get the corresponding objective definition from the manifest
                    const objectiveDef = this.getObjectiveDef(apiObjective.objectiveHash);

                    // Use API progress data directly, supplement with manifest definition details if found
                    return {
                        hash: apiObjective.objectiveHash,
                        complete: apiObjective.complete || false,
                        progress: apiObjective.progress || 0,
                        // Use completionValue from definition if available, otherwise default (or maybe check recordDef?)
                        completionValue: objectiveDef?.completionValue || recordDef.objectives?.find(o => o.objectiveHash === apiObjective.objectiveHash)?.completionValue || 1,
                        // Use progressDescription from definition if available
                        progressDescription: objectiveDef?.progressDescription || 'Complete Objective'
                    };
                }).filter(obj => obj !== null); // Filter out nulls just in case (though unlikely now)


                // Determine state based on record state and objectives
                // Check if we have a record from either source
                if (!record) {
                    console.log('No record found for challenge:', recordDef.displayProperties?.name);
                    return null;
                }

                // For seasonal challenges:
                // - ObjectiveNotCompleted (1) means there's still work to do
                // - RecordRedeemed (16) means it's been turned in
                // - Redeemable (2) means it can be claimed
                const state = record.state || 0;
                const objectiveNotCompleted = !!(state & DestinyRecordState.ObjectiveNotCompleted);
                const recordRedeemed = !!(state & DestinyRecordState.RecordRedeemed);
                const isRedeemable = !!(state & DestinyRecordState.Redeemable);

                // --- New Logging Location ---
                if (challengesLogged < MAX_CHALLENGES_TO_LOG) {
                    console.log(`--- Challenge Pre-Filter Log (${challengesLogged + 1}/${MAX_CHALLENGES_TO_LOG}) ---`);
                    console.log(`Name: ${recordDef.displayProperties?.name} (Hash: ${hash})`);
                    console.log('Raw Record Data:', record); // Log the raw record object
                    console.log('Calculated State Flags:', { state, objectiveNotCompleted, recordRedeemed, isRedeemable });
                    console.log('Processed Objectives:', objectives); // Log the processed objectives array
                    console.log('--- End Challenge Log ---');
                    challengesLogged++;
                }
                // --- End New Logging ---

                // A challenge is active if:
                // 1. It has objectives not completed OR
                // 2. It's redeemable (completed but not claimed)
                const isActive = objectiveNotCompleted || isRedeemable;

                // Only keep active challenges
                if (!isActive) {
                    // Keep this log to see *why* it's filtered, but the detailed log above is more useful now
                    console.log('Filtering out inactive challenge:', recordDef.displayProperties?.name, { state, objectiveNotCompleted, recordRedeemed, isRedeemable });
                    return null;
                }

                const isInProgress = objectives.some(o => o.progress > 0 && !o.complete);

                return {
                    hash: hash,
                    name: recordDef.displayProperties?.name || 'Unknown Challenge',
                    description: recordDef.displayProperties?.description || '',
                    icon: recordDef.displayProperties?.icon,
                    // Status flags for the UI
                    complete: !objectiveNotCompleted && !isRedeemable, // Only mark as complete if done and claimed
                    state: {
                        raw: state,
                        redeemed: recordRedeemed,
                        redeemable: isRedeemable,
                        inProgress: objectives.some(obj => !obj.complete && obj.progress > 0), // Show progress if any objectives are partially complete
                        objectiveNotCompleted: objectiveNotCompleted
                    },
                    objectives: objectives, // Already filtered out null objectives
                    objectiveProgress: objectives.length > 0 ? // Overall progress stats
                        {
                            complete: objectives.filter(obj => obj.complete).length,
                            total: objectives.length
                        } : null
                };
            })
            .filter(challenge => challenge !== null); // Remove null entries filtered earlier

        // Optional: Sorting can be done here or in categorizedBounties if needed
        // challenges.sort((a, b) => a.complete - b.complete); // Example sort

        return challenges; // Return the filtered and processed challenges
    }
  }
}
</script>
