<template>
  <span class="bounty" tabindex="0" :title="item.inventory.stackUniqueLabel">
    <div class="img"><img :src="'https://www.bungie.net/'+item.displayProperties.icon" /></div>
    <!-- <div class="name">{{ item.displayProperties.name }}</div> -->
    <div class="description" v-html="highlight(item.displayProperties.description)"></div>
    <!-- <div class="label">{{ item.inventory.stackUniqueLabel }}</div> -->
  </span>
</template>

<script>
import {symbols} from '@/symbols'

const weakHighlights = ['weapons', 'abilities', 'Special ammo', 'Heavy ammo',]

export default {
  name: 'Bounty',
  props: {
    item: {},
    keyword: String,
  },
  methods: {
    highlight(string) {
      const symbol = this.symbol ? `<span style="color: ${this.symbol.color}">${this.symbol.symbol}</span> ` : ''
      let res = string.replace(this.keyword, `${symbol}<span class="highlight">${this.keyword}</span>`)
      weakHighlights.forEach(kw => res = res.replace(kw, `<span class="highlight-weak">${kw}</span>`))
      return res
    }
  },
  computed: {
    symbol() {
      return symbols[this.keyword]
    }
  }
}
</script>

<style lang="scss">
.bounty {
  max-width: 260px;
  min-width: 160px;
  width: 30vw;
  // height: 111px;
  display: inline-block;
  position: relative;
  overflow: hidden;
  /* zoom: 0.7; */

  * {
    overflow-wrap: break-word;
    font-size: small;
  }
  .img {
    float: left;
    margin-right: 3px;
    img {
      max-width: 64.98px;
      width: 8vw;
      max-height: 64.98px;
      height: 8vw;
    }
  }
  .name {
    font-weight: bold;
    font-size: medium;
    color: silver;
  }
  .description {
    text-align: left;
    color: silver;
    margin-top: 5px;

    .highlight {
      color: white;
      font-weight: bold;
    }
    .highlight-weak {
      color: white;
      // font-weight: bold;
      font-style: italic;
    }
  }
  .label {
    color: darkgray;
    text-align: left;
    position: absolute;
    bottom: 0;
  }
}
</style>