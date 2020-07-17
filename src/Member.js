import * as api from "@/api";

export default class Member {
    membershipId
    destinyMembershipId
    inventory
    inventories
    characters
    loading = false

    constructor(membershipId){
        if (!membershipId) throw new Error('Invalid membershipId')
        this.membershipId = membershipId
    }

    async getDestinyMemberId() {
        const res = await api.getLinkedProfile(this.membershipId)
        this.destinyMembershipId = res.data.Response.profiles[0].membershipId
        console.log('this.destinyMembershipId: ', this.destinyMembershipId);
        return true
    }

    async fetchInventory() {
        if (this.loading) return false
        if (!this.destinyMembershipId) {
            await this.getDestinyMemberId()
        }
        this.loading = true
        const res = await api.getInventory(this.destinyMembershipId)
        this.loading = false
        this.characters = res.data.Response.characters.data
        const characterId = Object.keys(this.characters)[0]
        this.inventories = res.data.Response.characterInventories.data
        this.changeInventory(characterId)
        return true
    }

    changeInventory(characterId) {
        console.log('characterId: ', characterId);
        this.inventory = this.inventories[characterId].items
        return this.inventory
    }
}