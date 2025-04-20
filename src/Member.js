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
            console.log('Fetching linked profiles for membershipId:', this.membershipId);
            const res = await api.getLinkedProfile(this.membershipId);

            if (!res?.data?.Response?.profiles) {
                console.error("Invalid linked profile response:", res);
                throw new Error('Invalid linked profile response structure');
            }

            // Sort profiles by last played time
            const profiles = res.data.Response.profiles.sort(this.sortByLastPlayed);
            console.log('Linked profiles:', profiles);

            if (!profiles || profiles.length === 0) {
                throw new Error('No Destiny profiles found');
            }

            // Get the most recently played profile
            const profile = profiles[0];
            this.membershipType = profile.membershipType;
            this.destinyMembershipId = profile.membershipId;

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
            console.log('Fetching inventory for membershipType:', this.membershipType, 'destinyMembershipId:', this.destinyMembershipId);
            const res = await api.getInventory(this.destinyMembershipId, this.membershipType);

            if (!res?.data?.Response) {
                console.error("Invalid inventory response:", res);
                throw new Error("No response data received from getInventory");
            }

            const responseData = res.data.Response;
            console.log('Inventory response:', responseData);

            // Store the fetched data
            this.characters = responseData.characters?.data;
            this.inventories = responseData.characterInventories?.data;

            if (!this.characters || !this.inventories) {
                console.error("Characters or Inventories data missing in response:", responseData);
                throw new Error("Characters or Inventories data missing in API response");
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