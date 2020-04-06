import * as api from "@/api";

export default class Member {
    membershipId
    destinyMembershipId

    constructor(membershipId, destinyMembershipId){
        if (!membershipId) throw new Error('Invalid membershipId')
        this.membershipId = membershipId
        if (!destinyMembershipId) {
            const id = api.getLinkedProfile(this.membershipId).then(
                (res) => this.destinyMembershipId = res.data.Response.profiles[0].membershipId
            )
        }
    }

    async fetchInventory() {
        const res = await api.getInventory(this.destinyMembershipId)
    }
}