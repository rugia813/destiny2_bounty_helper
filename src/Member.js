import * as api from "@/api";

export default class Member {
    membershipId
    destinyMembershipId
    inventory

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
        if (!this.destinyMembershipId) {
            await this.getDestinyMemberId()
        }
        const res = await api.getInventory(this.destinyMembershipId)
        this.inventory = res.data.Response.characterInventories.data['2305843009300268887'].items
        return true
    }
}