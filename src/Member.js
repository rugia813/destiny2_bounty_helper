import * as api from "./api";
import { DestinyComponentType } from "bungie-api-ts/destiny2"; // Import if needed for clarity

export default class Member {
    membershipId
    membershipType
    destinyMembershipId
    inventory // Current character's inventory items
    inventories // All characters' inventories { characterId: { items: [...] } }
    characters // Character definitions { characterId: { ... } }
    profileRecords // Profile-wide records data { records: { recordHash: { ... } } }
    characterRecords // Character-specific records data { characterId: { records: { recordHash: { ... } } } }
    characterId // Currently selected character ID
    loading = false

    constructor(membershipId){
        if (!membershipId) throw new Error('Invalid membershipId')
        this.membershipId = membershipId
    }

    async getDestinyMemberId() {
        // This function might need adjustment if getLinkedProfile requires auth now
        try {
            const res = await api.getLinkedProfile(this.membershipId);
            // Sort by last played to get the most relevant profile
            const profile = res.data.Response.profiles?.sort(this.sortByLastPlayed)[0];
            if (!profile) {
                console.error("No valid Destiny profiles found for this Bungie account.", res.data.Response);
                // Attempt to find a Destiny profile even if others exist (e.g., Stadia placeholder)
                const destinyProfile = res.data.Response.profiles?.find(p => p.membershipId && p.membershipType);
                 if (!destinyProfile) throw new Error('No Destiny profile found.');
                 console.log('Using first available Destiny profile:', destinyProfile);
                 this.membershipType = destinyProfile.membershipType;
                 this.destinyMembershipId = destinyProfile.membershipId;
            } else {
                console.log('Primary profile: ', profile);
                this.membershipType = profile.membershipType;
                this.destinyMembershipId = profile.membershipId;
            }
            console.log('Using destinyMembershipId:', this.destinyMembershipId, 'Type:', this.membershipType);
            return true;
        } catch (error) {
            console.error("Failed to get Destiny Member ID:", error);
            // Handle potential auth errors from getLinkedProfile if they occur
            return false; // Indicate failure
        }
    }

    sortByLastPlayed(a, b) {
        const atime = +new Date(a.dateLastPlayed)
        const btime = +new Date(b.dateLastPlayed)
        // Handle cases where dateLastPlayed might be missing or invalid
        if (isNaN(atime) && isNaN(btime)) return 0;
        if (isNaN(atime)) return 1; // Put profiles without date last
        if (isNaN(btime)) return -1; // Put profiles without date first

        if (atime === btime) return 0
        return btime - atime; // Sort descending (most recent first)
    }

    // Renamed for clarity as it fetches more than just inventory now
    async fetchProfileData() {
        if (this.loading) return false; // Prevent concurrent fetches
        this.loading = true;
        try {
            // Ensure we have the destiny membership ID first
            if (!this.destinyMembershipId || !this.membershipType) {
                const gotId = await this.getDestinyMemberId();
                if (!gotId) {
                    throw new Error("Could not determine Destiny membership ID.");
                }
            }

            // Call the new API function to get profile data including records
            const res = await api.getProfileData(this.membershipType, this.destinyMembershipId);
            const responseData = res.data.Response;

            if (!responseData) {
                throw new Error("No response data received from getProfileData");
            }

            // Store the fetched data
            this.characters = responseData.characters?.data;
            this.inventories = responseData.characterInventories?.data;
            this.profileRecords = responseData.profileRecords?.data;
            this.characterRecords = responseData.characterRecords?.data;

            // Ensure characters and inventories were fetched successfully
            if (!this.characters || !this.inventories) {
                 console.error("Characters or Inventories data missing in response:", responseData);
                 throw new Error("Characters or Inventories data missing in API response.");
            }

            // Set default character ID if not already set, or if current ID is invalid
            const characterIds = Object.keys(this.characters);
            if (!this.characterId || !characterIds.includes(this.characterId)) {
                 this.characterId = characterIds[0];
            }

            // Update the current inventory based on the selected character
            this.changeInventory(this.characterId);

        } catch (error) {
            console.error('Failed to fetch profile data:', error);
            // Consider clearing stale data on failure?
            // this.characters = null;
            // this.inventories = null;
            // etc.
            this.loading = false;
            return false; // Indicate failure
        } finally {
            this.loading = false; // Ensure loading state is reset
        }
        return true; // Indicate success
    }

    // This function now just switches the view based on already fetched data
    changeInventory(characterId) {
        if (!this.inventories || !this.inventories[characterId]) {
            console.warn(`Inventory data for character ${characterId} not available.`);
            this.inventory = []; // Set to empty array if data is missing
            return this.inventory;
        }
        console.log('Switching inventory view to characterId: ', characterId);
        this.characterId = characterId;
        this.inventory = this.inventories[characterId].items;
        // Potentially update displayed records based on character too, if needed later
        return this.inventory;
    }
}