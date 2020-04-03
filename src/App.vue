<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import * as api from "@/api";
import * as cokie from "@/cookie";

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  created() {
    window.api = api
  },
  async mounted() {
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
