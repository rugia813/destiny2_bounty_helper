<template>
  <div id="app">

    <div class="login-container" v-if="(!characters || !Object.keys(characters).length)">

      <!-- DEV code input -->
      <input v-if="dev" @blur="e => handleCode(e.target.value)" />

      <!-- Login -->
      <div class="loginPanel" v-if="!getToken() && !getRefreshToken()">
        <div class="loginBtnPanel">
          <button
            @click="getAutho"
            class="loginBtn"
          >
            Login with Bungie.net
          </button>
        </div>
        <p>This app helps you to do similar bounties at the same time, by categorizing them by weapon types, element types and activites.</p>
        Example:
        <div class="loginImgPanel">
          <img src="https://i.imgur.com/rSHR0q7.png" />
        </div>
      </div>

      <!-- loading -->
      <div class="loading" v-else>
        Loading
      </div>
    </div>

    <template v-else>

      <!-- Characters -->
      <div class="character-row">

        <CharSelect
          :activeId="member.characterId"
          :characters="characters"
          @change="characterId => member.changeInventory(characterId)"
        />

        <!-- Refresh -->
        <span class="refresh" @click="refresh">{{refreshing ? 'Refreshing' : 'Refresh'}}</span>

        <!-- Config -->
        <div class="config-panel">
          Config
          <div class="bubble">
            <div>
              Activities
              <!-- <input :value="activities" @change="parseActivities" /> -->
              <textarea @change="parseActivities" v-text="activities.join(',')"></textarea>
            </div>
            <div>
              Keywords
              <textarea @change="parseKeywords" v-text="keywords.join(',')"></textarea>
            </div>
          </div>
        </div>

      </div>

      <!-- Bounty Table -->
      <div class="bounties">
        <table v-if="inventory.length">
          <thead>
            <tr>
              <th v-for="kw in ['', ...filteredKeywords]" :key="kw">{{kw}}</th>
              <th v-if="categorizedBounties.count[keywords.length]">uncategorized</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in filteredActivities" :key="category">
              <td>{{ category }}</td>
              <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx]" :key="kwIdx">
                <Bounty
                  :item="t(item.itemHash)"
                  :keyword="kw"
                  v-for="(item) in categorizedBounties[category.toLowerCase()][kwIdx]" :key="item.itemInstanceId"
                />
              </td>
              <td v-if="categorizedBounties.count[keywords.length]" class="lastTd">
                <Bounty
                  :item="t(item.itemHash)"
                  v-for="(item) in categorizedBounties[category.toLowerCase()][keywords.length]" :key="item.itemInstanceId"
                />
              </td>
            </tr>
          </tbody>
        </table>
                <!-- <Bounty
                  :item="t(item.itemHash)"
                  v-for="(item, i) in inventory" :key="i"
                /> -->
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
import CharSelect from './components/CharSelect.vue'

const keywords = [
  'Submachine Gun', 'Machine Gun', 'Grenade Launcher', 'Sword', 'Linear Fusion Rifle', 'Fusion Rifle', 'Shotgun', 'Glaive',
  'Hand Cannon', 'Sidearm', 'Pulse Rifle', 'Scout Rifle', 'Sniper Rifle', 'Auto Rifle', 'Rocket Launcher', 'Bow', 'Trace Rifle',
  'Solar', 'Void', 'Arc', 'Stasis',
  // 'Kinetic', 'Energy',
  'weapons',
  'Scorn', 'Fallen', 'Cabal', 'Vex', 'Taken', 'Hive',
  'Super', 'Orb',
  'melee', 'grenade', 'finisher',
  'precision', 'public event', 'Lost Sector',
]

const activities = [
  'strikes',
  'crucible',
  'gambit',
  'throneworld',
  'xur',
  'war_table',
]

export default {
  name: 'App',
  components: {
    Bounty,
    CharSelect,
  },
  data() {
    return {
      member: undefined,
      activities,
      keywords,
      refreshing: false,
    }
  },
  created() {
    // when redirected back from authorization page
    const code = this.getCode()
    if (code) {
      setTimeout(window.close, 1)
      opener.setCode(code)
    }

    window['api'] = api
    window['manifest'] = Manifest
    window['t'] = Manifest.t
  },
  async mounted() {
    await Manifest.fetchManifest()

    this.fetchToken()

    this.activities = this.loadConfig('activities') || activities
    this.keywords = this.loadConfig('keywords') || keywords
  },
  methods: {
    getAutho() {
      const popup = api.authorize()
      window.setCode = this.handleCode.bind(this)
    },
    getCode() {
      const qs = window.location.search
      const _qs = {}
      qs.split('&').forEach(str => {
        const _str = str.split('=')
        const k = _str[0].replace('?', '')
        _qs[k] = _str[1]
      })
      return _qs.code
    },
    t(hash) {
      return Manifest.t(hash)
    },
    async handleCode(code) {
      console.log('redirected with code: ', code);
      const res = await api.getToken(code)
      console.log('res: ', JSON.stringify(res));

      cookie.setToken(res.data.access_token)
      cookie.setMemberId(res.data.membership_id)

      const refresh_token = res.data.refresh_token
      // cookie.setToken(res.data.access_token)
      cookie.setRefreshToken(refresh_token, res.data.refresh_expires_in)

      // window.location.replace('/')
      this.fetchToken()
    },
    async fetchToken() {
      // have token
      const token = cookie.getToken()
      const memberId = cookie.getMemberId()
      if (token) {
        console.log('has token:', token);
        // api.getUser(memberId)
        try {
          const member = new Member(memberId)
          this.member = member
          const isSuccess = await member.fetchInventory()
          if (!isSuccess) this.refreshAuthToken()
        } catch (error) {
          console.error(error)
          cookie.removeToken()
          cookie.removeRefreshToken()
          // window.location.reload()
          alert('something went wrong')
        }
        // const mId = (await api.getLinkedProfile(memberId)).data.Response.profiles[0].membershipId
        // api.getInventory(mId)
      } else {
        console.log('does not have token');
        const refresh_token = cookie.getRefreshToken()
        if (refresh_token) {
          this.refreshAuthToken()
        }
      }
    },
    getToken() {
      return cookie.getToken()
    },
    getRefreshToken() {
      return cookie.getRefreshToken()
    },
    async refresh() {
      if (this.refreshing) return

      this.refreshing = true
      const isSuccess = await this.member.fetchInventory()
      this.refreshing = false

      if (!isSuccess) {
        this.refreshAuthToken()
      }
    },
    async refreshAuthToken() {
      const refresh_token = cookie.getRefreshToken()
      if (refresh_token) {
        console.log('refresh');
        const res = await api.refresh(refresh_token)
        console.log('refresh res: ', res);
        cookie.setToken(res.data.access_token)
        cookie.setRefreshToken(res.data.refresh_token, res.data.refresh_expires_in)
        cookie.setMemberId(res.data.membership_id)
        window.location.reload()
      }
    },
    parseActivities(e) {
      const value = e.target.value
      this.activities = value.split(',')
      this.saveConfig('activities', this.activities)
    },
    parseKeywords(e) {
      const value = e.target.value
      this.keywords = value.split(',')
      this.saveConfig('keywords', this.keywords)
    },
    saveConfig(name, val) {
      localStorage.setItem(name, val)
    },
    loadConfig(name) {
      const str = localStorage.getItem(name)
      return (str) ? str.split(',') : false
    }
  },
  computed: {
    dev() {
      return process.env.NODE_ENV === 'development'
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
      const activities = {}, misc = [], count = []
      const keywords = this.keywords

      // init activities arr
      this.activities.forEach(act => {
        activities[act] = []
      })

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
          this.activities.forEach(act => {
            // if (_item.inventory.stackUniqueLabel.match(new RegExp(`^bounties.${act}`, 'gi'))) arr = activities[act]
            if (_item.inventory.stackUniqueLabel.match(new RegExp(`(?=.*bounties)(?=.*${act}).`, 's'))) arr = activities[act]
          })
          arr = arr || misc

          if (!arr[kwIdx]) arr[kwIdx] = []
          arr[kwIdx].push(item)

          count[kwIdx] = (count[kwIdx]) ? count[kwIdx] + 1 : 1
        } catch (error) {
          console.warn('skipping', item, this.t(item.itemHash))
        }
      })

      return {
        ...activities,
        misc,
        count
      }
    },
    filteredActivities() {
      return [
        ...activities
          .filter(act => this.categorizedBounties[act].length)
          .map(act => act.toUpperCase()),
        'MISC'
      ]
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
  background: rgb(24,24,24);
  background: linear-gradient(306deg, rgba(24,24,24,1) 0%, rgba(44,44,44,1) 48%, rgba(36,36,36,1) 100%);
  margin: 0;
  overflow-x: hidden;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
#app, .loginPanel {
  text-align: center;
  color: silver;
  height: calc(100vh - 10px);
  width: 100vw;
  // margin-top: 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  // margin: 1%;
}
.loginPanel {
  align-items: center;
}
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
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
  flex: 3;
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
.character-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 3px;
  z-index: 1;
}
.refresh {
  padding: 5px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    color: white;
  }
}
.config-panel {
  /* width: 128px;
  height: 128px; */
  /* flex: 1; */
  position: relative;
  .bubble {
    position: absolute;
    display: none;
    border: silver solid thin;
    background: rgb(24,24,24);
    background: linear-gradient(306deg, rgba(24,24,24,1) 0%, rgba(44,44,44,1) 48%, rgba(36,36,36,1) 100%);
  }
  &:hover>.bubble {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 3px;
    div {
      display: flex;
      flex-direction: column;
    }
  }
  @media (max-width: 790px) and (min-width: 495px) {
    &:hover>.bubble {
      right: 0;
    }
  }
  textarea {
    max-width: 80vw;
    width: 320px;
    /* max-height: 40vh; */
    height: 30vh;
  }
}
.bounties {
  text-align: left;
  margin: auto;
  // margin-top: 5%;
  padding: 3px;
  color: white;
  overflow-x: auto;
  width: 99.5vw;
  flex: 5;

  table {
    border-collapse: collapse;
    // margin: 0 2em 0 0;

    th {
      text-align: center;
      font-size: 12px;
    }
    td {
      padding: 2px;
      vertical-align: top;
    }
    td:nth-child(1) {
      vertical-align: middle;
      font-weight: bold;
      text-align: center;
      font-size: 12px;
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
