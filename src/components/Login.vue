<template>
  <div class="login-container">
    <!-- DEV code input -->
    <input v-if="isDevMode" @blur="e => handleCode(e.target.value)" placeholder="paste code from qs here" />

    <!-- Login -->
    <div class="loginPanel" v-if="!getToken() && !getRefreshToken() && !loadingInitialData">
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
      Loading Manifest and Profile Data...
      <span v-if="!Manifest.ready">(Manifest...)</span>
      <span v-if="!member || member.loading">(Profile...)</span>
    </div>
  </div>
</template>

<script>
import * as api from "../api";
import * as cookie from "../cookie";
import Manifest from "../Manifest";

export default {
  name: 'Login',
  props: {
    member: Object,
    loadingInitialData: Boolean,
    isDevMode: Boolean
  },
  data() {
    return {
      Manifest
    }
  },
  methods: {
    getAutho() {
      // Ensure setCode is available on window before opening popup
      window.setCode = this.handleCode.bind(this);
      const popup = api.authorize();
      if (!popup) {
        alert("Popup blocked. Please allow popups for this site.");
      }
    },
    getToken() {
      return cookie.getToken();
    },
    getRefreshToken() {
      return cookie.getRefreshToken();
    },
    async handleCode(code) {
      this.$emit('handle-code', code);
    }
  }
}
</script>