<template>
  <span class="bounty" :title="item.inventory.stackUniqueLabel">
    <div class="img"><img :src="'https://www.bungie.net/'+item.displayProperties.icon" /></div>
    <!-- <div class="name">{{ item.displayProperties.name }}</div> -->
    <div class="description" v-html="highlight(keyword, item.displayProperties.description)"></div>
    <!-- <div class="label">{{ item.inventory.stackUniqueLabel }}</div> -->
  </span>
</template>

<script>
export default {
  name: 'Bounty',
  props: {
    item: {},
    keyword: String,
  },
  methods: {
    highlight(keyword, string) {
      return string.replace(keyword, `<span class="highlight">${keyword}</span>`)
        .replace('weapons', `<span class="highlight-weak">weapons</span>`)
        .replace('abilities', `<span class="highlight-weak">abilities</span>`)
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