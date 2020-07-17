<template>
  <div id="app">

    <template v-if="(!characters || !Object.keys(characters).length)">
      <!-- Login -->
      <div class="loginPanel" v-if="!code && !getToken()">
        <div class="loginBtnPanel">
          <button
            @click="getAutho"
            class="loginBtn"
          >
            Login with Bungie.net
          </button>
        </div>
        Example:
        <div class="loginImgPanel">
          <img src="https://i.imgur.com/rSHR0q7.png" />
        </div>
      </div>

      <!-- loading -->
      <div class="loading" v-else>
        Loading
      </div>
    </template>

    <template v-else>
      <div class="characters">
        <span class="character" v-for="character in characters" :key="character.characterId" @click="member.changeInventory(character.characterId)">
          <img :src="'https://www.bungie.net/'+character.emblemBackgroundPath" />
          <div class="class">{{['Titan', 'Hunter', 'Warlock'][character.classType]}}</div>
          <div class="light">{{character.light}}</div>
        </span>
        <span class="refresh" @click="refresh">Refresh</span>
      </div>

      <div class="bounties">
        <table v-if="inventory.length">
          <thead>
            <tr>
              <th v-for="kw in ['', ...filteredKeywords]" :key="kw">{{kw}}</th>
              <th v-if="categorizedBounties.count[keywords.length]">uncategorized</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in ['Strike', 'Crucible', 'Gambit', 'Misc']" :key="category">
              <td>{{ category }}</td>
              <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx]" :key="kwIdx">
                <Bounty
                  :item="t(item.itemHash)"
                  :keyword="kw"
                  v-for="(item, i) in categorizedBounties[category.toLowerCase()][kwIdx]" :key="item.itemInstanceId"
                />
              </td>
              <td v-if="categorizedBounties.count[keywords.length]" class="lastTd">
                <Bounty
                  :item="t(item.itemHash)"
                  v-for="(item, i) in categorizedBounties[category.toLowerCase()][keywords.length]" :key="item.itemInstanceId"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import Bounty from './components/Bounty.vue'
import * as api from "./api";
import * as cookie from "./cookie";
import Manifest from "./Manifest";
import Member from "./Member";

const keywords = [
  'Submachine Gun', 'Machine Gun', 'Grenade Launcher', 'Sword', 'Linear Fusion Rifle', 'Fusion Rifle', 'Shotgun',
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
    if (this.code) {
      console.log('redirected with code: ', this.code);
      const res = await api.getToken(this.code)
      console.log('res: ', JSON.stringify(res));
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
      try {
        const member = new Member(memberId)
        this.member = member
        await member.fetchInventory()
      } catch (error) {
        console.error(error)
        cookie.removeToken()
        window.location.reload()
      }
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
    },
    refresh() {
      this.member.fetchInventory()
    }
  },
  computed: {
    code() {
      const qs = window.location.search
      const _qs = {}
      qs.split('&').forEach(str => {
        const _str = str.split('=')
        const k = _str[0].replace('?', '')
        _qs[k] = _str[1]
      })
      return _qs.code
    },
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
body,html {
  background-color: rgb(58, 57, 57);
  margin: 0;
}
#app, .loginPanel {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: silver;
  height: 100vh;
  width: 100vw;
  // margin-top: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  // margin: 1%;
}
.loading {
  display: flex;
  align-items: center;
  height: 100%;
}
.loginBtnPanel {
  flex: 1;
  display: flex;
  align-items: center;
}
.loginImgPanel {
  flex: 2;
  width: 90%;
  overflow-x: scroll;
}
.loginBtn {
  background-color: #d69e25;
  border: 2px solid #ffc456;
  color: white;
  padding: 8px 32px;
  text-align: center;
  text-decoration: none;
  // display: inline-block;
  font-size: 16px;
  margin: 3px;
  transition-duration: 0.4s;
  cursor: pointer;

  &:hover {
    border: 5px solid rgb(58, 57, 57);
    outline: white solid 1px;
    margin: 0;
  }
}
.characters {
  // white-space: nowrap;
  // text-align: center;
  flex: 1;
  width: fit-content;
  margin-top: 1%;

  * {
    cursor: pointer;
  }

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

  .refresh {
    flex: 1;
    height: fit-content;
    padding: 5px;

    &:hover {
      text-decoration: underline;
      color: white;
    }
  }
}
.bounties {
  text-align: left;
  margin: auto;
  // margin-top: 5%;
  padding: 3px;
  color: white;
  width: fit-content;
  flex: 3;

  table {
    border-collapse: collapse;
    // margin: 0 2em 0 0;

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
    .lastTd {
      // display: flex;
    }
  }
  table, td, th {
    border: silver solid thin;
  }
}
</style>
