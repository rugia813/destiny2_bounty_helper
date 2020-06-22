<template>
  <span class="bounty">
    <div class="img"><img :src="'https://www.bungie.net/'+item.displayProperties.icon" /></div>
    <div class="name">{{ item.displayProperties.name }}</div>
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
    }
  }
}
</script>

<style lang="scss">
.bounty {
  width: 360px;
  // height: 111px;
  display: inline-block;
  position: relative;
  overflow: hidden;

  * {
    overflow-wrap: break-word;
    font-size: small;
  }
  .img {
    float: left;
    margin: 0 3px 10px 0;
  }
  .name {
    font-weight: bold;
    font-size: medium;
  }
  .description {
    text-align: left;

    .highlight {
      color: white!important;
      font-weight: bold;
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