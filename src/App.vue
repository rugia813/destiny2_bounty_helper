<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <h2 @click="getAutho">Autho</h2>

    <span v-for="character in characters" :key="character.characterId" @click="member.changeInventory(character.characterId)">
      <img :src="'https://www.bungie.net/'+character.emblemBackgroundPath" />
    </span>

    <Bounty :item="t(item.itemHash)" v-for="item in categorizedBounties.strike" :key="item.itemInstanceId" />
    <Bounty :item="t(item.itemHash)" v-for="item in categorizedBounties.crucible" :key="item.itemInstanceId" />
    <Bounty :item="t(item.itemHash)" v-for="item in categorizedBounties.gambit" :key="item.itemInstanceId" />
    <Bounty :item="t(item.itemHash)" v-for="item in categorizedBounties.misc" :key="item.itemInstanceId" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Bounty from './components/Bounty.vue'
import * as api from "./api";
import * as cookie from "./cookie";
import Manifest from "./Manifest";
import Member from "./Member";

// { 
//   "itemHash": 1664372054, 
//   "itemInstanceId": "6917529122156987808", 
//   "quantity": 1, 
//   "bindStatus": 0, 
//   "location": 1, 
//   "bucketHash": 1498876634, 
//   "transferStatus": 0, 
//   "lockable": true, 
//   "state": 5, 
//   "dismantlePermission": 2, 
//   "isWrapper": false, 
//   "versionNumber": 0 
// }

export default {
  name: 'App',
  components: {
    HelloWorld,
    Bounty,
  },
  data() {
    return {
      member: undefined
    }
  },
  created() {
    window['api'] = api
    window['manifest'] = Manifest
    window['t'] = Manifest.t
  },
  async mounted() {
    // have token
    const token = cookie.getToken()
    const memberId = cookie.getMemberId()
    if (token) {
      // api.getUser(memberId)
      const member = new Member(memberId)
      this.member = member
      await member.fetchInventory()
      // const mId = (await api.getLinkedProfile(memberId)).data.Response.profiles[0].membershipId
      // api.getInventory(mId)

      await Manifest.fetchManifest()

      this.inventory = member.inventory
    }

    // when redirected back from authorization page
    const qs = window.location.search
    const _qs = {}
    qs.split('&').forEach(str => {
      const _str = str.split('=')
      const k = _str[0].replace('?', '')
      _qs[k] = _str[1]
    })
    if (_qs.code) {
      const res = await api.getToken(_qs.code)
      cookie.setToken(res.data.access_token)
      cookie.setMemberId(res.data.membership_id)
      window.location.replace('/')
    }
  },
  methods: {
    getAutho() {
      api.authorize()
    },
    t(hash) {
      return Manifest.t(hash)
    }
  },
  computed: {
    inventory() {
      if (!this.member) return []
      return this.member.inventory || []
    },
    bounties() {
      return this.inventory.filter(item => {
        const _item = this.t(item.itemHash)
        return !_item.itemCategoryHashes.includes(16) && !_item.sockets && _item.objectives && _item.objectives.objectiveVerbName
        // return !(_item.objectives && _item.objectives.questlineItemHash) && _item.sockets
      })
    },
    // strike() {
    //   return this.bounties.filter(item => this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.strikes/))
    // },
    // crucible() {
    //   return this.bounties.filter(item => this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.crucible/))
    // },
    // gambit() {
    //   return this.bounties.filter(item => this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.gambit/))
    // },
    characters() {
      const member = this.member
      if (!member) return []
      return member.characters
    },
    categorizedBounties() {
      const all = this.bounties
      const strike = [], crucible = [], gambit = [], misc = []
      all.forEach(item => {
        try {
            if (this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.strikes/)) strike.push(item)
            else if (this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.crucible/)) crucible.push(item)
            else if (this.t(item.itemHash).inventory.stackUniqueLabel.match(/^bounties.gambit/)) gambit.push(item)
            else misc.push(item)
        } catch (error) {
          console.error(error)
        }
      })
      return {
        strike,
        crucible,
        gambit,
        misc
      }
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
