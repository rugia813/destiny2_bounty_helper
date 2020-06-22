<template>
  <div id="app">

    <!-- <img alt="Vue logo" src="./assets/logo.jpg"> -->

    <button
      v-if="(!characters || !Object.keys(characters).length) && !getToken()"
      @click="getAutho"
      class="login"
    >
      Login
    </button>

    <div class="characters" v-else>
      <span class="character" v-for="character in characters" :key="character.characterId" @click="member.changeInventory(character.characterId)">
        <img :src="'https://www.bungie.net/'+character.emblemBackgroundPath" />
        <div class="class">{{['Titan', 'Hunter', 'Warlock'][character.classType]}}</div>
        <div class="light">{{character.light}}</div>
      </span>
    </div>

    <div class="bounties">
      <table v-if="inventory.length">
        <thead>
          <tr>
            <th v-for="kw in ['', ...filteredKeywords]">{{kw}}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in ['Strike', 'Crucible', 'Gambit', 'Misc']">
            <td>{{ category }}</td>
            <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx]">
              <Bounty
                :item="t(item.itemHash)"
                :keyword="kw"
                v-for="(item, i) in categorizedBounties[category.toLowerCase()][kwIdx]" :key="item.itemInstanceId"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Bounty from './components/Bounty.vue'
import * as api from "./api";
import * as cookie from "./cookie";
import Manifest from "./Manifest";
import Member from "./Member";

const keywords = [
  'Submachine Gun', 'Machine Gun', 'Grenade Launcher', 'Sword', 'Linear Fusion Rifle', 'Fusion Rifle',
  'Hand Cannon', 'Sidearm', 'Pulse Rifle', 'Scout Rifle', 'Sniper Rifle', 'Auto Rifle', 'Rocket Launcher',
  'Solar', 'Void', 'Arc',
  'Scorn', 'Fallen', 'Cabal', 'Vex', 'Taken', 'Hive',
  'Super', 'Orb',
  'melee', 'grenade', 'finisher',
]

export default {
  name: 'App',
  components: {
    Bounty,
  },
  data() {
    return {
      member: undefined,
      keywords,
    }
  },
  created() {
    window['api'] = api
    window['manifest'] = Manifest
    window['t'] = Manifest.t
  },
  async mounted() {
    await Manifest.fetchManifest()

    // when redirected back from authorization page
    const qs = window.location.search
    const _qs = {}
    qs.split('&').forEach(str => {
      const _str = str.split('=')
      const k = _str[0].replace('?', '')
      _qs[k] = _str[1]
    })
    if (_qs.code) {
      console.log('redirected with code: ', _qs.code);
      const res = await api.getToken(_qs.code)
      cookie.setToken(res.data.access_token)
      cookie.setMemberId(res.data.membership_id)
      const refresh_token = res.data.refresh_token
      // setInterval(async () => {
      //   const res = await api.refresh(refresh_token)
        cookie.setToken(res.data.access_token)
        cookie.setRefreshToken(refresh_token)
      // }, 6000);
      window.location.replace('/')
    }

    // have token
    const token = cookie.getToken()
    const memberId = cookie.getMemberId()
    if (token) {
      console.log('has token:', token);
      // api.getUser(memberId)
      const member = new Member(memberId)
      this.member = member
      await member.fetchInventory()
      // const mId = (await api.getLinkedProfile(memberId)).data.Response.profiles[0].membershipId
      // api.getInventory(mId)
    } else {
      console.log('does not have token');
      const refresh_token = cookie.getRefreshToken()
      if (refresh_token) {
        console.log('refresh');
        const res = await api.refresh(refresh_token)
        console.log('refresh res: ', res);
      }
    }
  },
  methods: {
    getAutho() {
      api.authorize()
    },
    t(hash) {
      return Manifest.t(hash)
    },
    getToken() {
      return cookie.getToken()
    }
  },
  computed: {
    inventory() {
      if (!this.member || !Manifest.ready) return []
      return this.member.inventory || []
    },
    bounties() {
      return this.inventory.filter(item => {
        try {
            const _item = this.t(item.itemHash)
            return !_item.itemCategoryHashes.includes(16) && !_item.sockets && _item.objectives && _item.objectives.objectiveVerbName
            // return !(_item.objectives && _item.objectives.questlineItemHash) && _item.sockets
        } catch (error) {
          // console.log(error);
          console.warn('skipping', item, this.t(item.itemHash));
          return false
        }
      })
    },
    characters() {
      const member = this.member
      if (!member) return []
      return member.characters
    },
    categorizedBounties() {
      const all = this.bounties
      const strike = [], crucible = [], gambit = [], misc = [], count = []
      const getKwIdx = (item) => {
        for (let i in keywords) {
          const kw = keywords[i]
          const hasMatch = item.displayProperties.description.includes(kw)
          if (hasMatch) return i
        }
        return keywords.length
      }
      all.forEach(item => {
        try {
          const _item = this.t(item.itemHash)
          const kwIdx = getKwIdx(_item)
          let arr
          if (_item.inventory.stackUniqueLabel.match(/^bounties.strikes/)) arr = strike
          else if (_item.inventory.stackUniqueLabel.match(/^bounties.crucible/)) arr = crucible
          else if (_item.inventory.stackUniqueLabel.match(/^bounties.gambit/)) arr = gambit
          else arr = misc

          if (!arr[kwIdx]) arr[kwIdx] = []
          arr[kwIdx].push(item)

          count[kwIdx] = (count[kwIdx]) ? count[kwIdx] + 1 : 1
        } catch (error) {
          console.warn('skipping', item, this.t(item.itemHash))
        }
      })
      return {
        strike,
        crucible,
        gambit,
        misc,
        count
      }
    },
    filteredKeywords() {
      const count = this.categorizedBounties.count
      return this.keywords.filter((kw, i) => count[i])
    }
  }
}
</script>

<style lang="scss">
body {
  background-color: rgb(58, 57, 57);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: silver;
  margin-top: 60px;
}
.login {
  background-color: #d69e25;
  border: 2px solid #ffc456;
  color: white;
  padding: 8px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  transition-duration: 0.4s;
  cursor: pointer;

  &:hover {
  border: 5px solid black;
    outline: white solid 1px;
  }
}
.characters {
  white-space: nowrap;
  text-align: center;

  .character {
    display: inline-block;
    position: relative;
    height: fit-content;
    margin-right: 10px;
    zoom: 0.8;

    .class {
      position: absolute;
      left: 22%;
      top: 8%;
      color: white;
      font-size: x-large;
      font-weight: bold;
    }
    .light {
      position: absolute;
      right: 5%;
      top: 8%;
      color: cyan;
      font-size: xx-large;
      font-weight: bold;
    }
  }
}
.bounties {
  text-align: left;
  margin: auto;
  margin-top: 5%;
  color: white;
  width: fit-content;

  table {
    border-collapse: collapse;
    margin: 0 2em 0 0;

    th {
      text-align: center;
    }
    td {
      padding: 2px;
      vertical-align: top;
    }
    td:nth-child(1) {
      vertical-align: middle;
      font-weight: bold;
      text-align: center;
    }
  }
  table, td, th {
    border: silver solid thin;
  }
}
</style>
