import * as api from "@/api";

export default class Member {
    membershipId
    membershipType
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
        const profile = res.data.Response.profiles.sort(this.sortByLastPlayed)[0]
        console.log('profile: ', profile);
        this.membershipType = profile.membershipType
        this.destinyMembershipId = profile.membershipId
        console.log('this.destinyMembershipId: ', this.destinyMembershipId);
        return true
    }

    sortByLastPlayed(a, b) {
        const atime = +new Date(a.dateLastPlayed)
        const btime = +new Date(b.dateLastPlayed)
        if (atime == btime) return 0
        if (atime > btime) return 1
        return -1
    }

    async fetchInventory() {
        if (this.loading) return false
        if (!this.destinyMembershipId) {
            await this.getDestinyMemberId()
        }
        this.loading = true
        const res = await api.getInventory(this.destinyMembershipId, this.membershipType)
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