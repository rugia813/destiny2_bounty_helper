<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <h2 @click="getAutho">Autho</h2>

    <span v-for="item in bounties" :key="item.itemInstanceId">
      <Bounty :item="t(item.itemHash)" />
      <!-- <span>{{item}}</span> -->
      <!-- <pre style="text-align: left;">{{t(item.itemHash)}}</pre> -->
      <!-- <hr/> -->
    </span>
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
      inventory: [],
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
    bounties() {
      return this.inventory.filter(item => {
        const _item = this.t(item.itemHash)
        return !_item.itemCategoryHashes.includes(16) && !_item.sockets && _item.objectives && _item.objectives.objectiveVerbName
        // return !(_item.objectives && _item.objectives.questlineItemHash) && _item.sockets
      })
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
