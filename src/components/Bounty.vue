<template>
  <span class="bounty"
        :class="{ challenge: item.isChallenge }"
        tabindex="0"
        :title="getTitle">
    <div class="img">
      <img v-if="item.isChallenge"
           :src="'https://www.bungie.net/' + item.icon"
           :alt="item.name" />
      <img v-else
           :src="'https://www.bungie.net/' + item.definition.displayProperties.icon"
           :alt="item.definition.displayProperties.name" />
    </div>
    <div v-if="item.isChallenge" class="challenge-status">
      <span v-if="item.complete" class="status completed">✓</span>
      <span v-else-if="item.state?.redeemable" class="status redeemable">!</span>
      <span v-else-if="hasProgress" class="status in-progress">↻</span>
    </div>
    <div class="name" v-if="item.isChallenge">{{ item.name }}</div>
    <div class="description" v-html="highlight(getDescription)"></div>
    <div v-if="item.isChallenge && item.objectives" class="objectives">
      <div v-for="obj in item.objectives"
           :key="obj.hash"
           class="objective"
           :class="{ completed: obj.complete }">
        {{ obj.progressDescription }}: {{ obj.progress }}/{{ obj.completionValue }}
      </div>
    </div>
  </span>
</template>

<script>
import {symbols} from '../symbols'

const weakHighlights = [
  'weapons', 'abilities',
  'Special ammo', 'Heavy ammo',
]

export default {
  name: 'Bounty',
  props: {
    item: {
      type: Object,
      required: true
    },
    keyword: String,
  },
  computed: {
    getTitle() {
      if (this.item.isChallenge) {
        return this.item.name;
      }
      return this.item.definition.inventory?.stackUniqueLabel || '';
    },
    getDescription() {
      if (this.item.isChallenge) {
        return this.item.description;
      }
      return this.item.definition.displayProperties?.description || '';
    },
    hasProgress() {
      if (!this.item.isChallenge) return false;
      return this.item.objectives?.some(o => o.progress > 0) || false;
    }
  },
  methods: {
    highlight(string) {
      if (!string || !this.keyword) return string;
      let res = string.replace(this.keyword, `<span class="highlight">${this.getSymbol(this.keyword)}${this.keyword}</span>`);
      weakHighlights.forEach(kw => res = res.replace(kw, `<span class="highlight-weak">${this.getSymbol(kw)}${kw}</span>`));
      return res;
    },
    getSymbol(kw) {
      const symbol = symbols[kw];
      return symbol ? `<span style="color: ${symbol.color}">${symbol.symbol}</span> ` : '';
    }
  },
}
</script>

<style lang="scss">
.bounty {
  max-width: 260px;
  min-width: 160px;
  width: 30vw;
  display: inline-block;
  position: relative;
  overflow: hidden;

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
      white-space: nowrap;
    }
    .highlight-weak {
      color: white;
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