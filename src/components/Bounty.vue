<template>
  <span class="bounty"
        :class="{
          challenge: item.isChallenge,
          'challenge-complete': item.isChallenge && !item.state.objectiveNotCompleted,
          'challenge-redeemable': item.isChallenge && item.state.redeemable,
          'challenge-in-progress': item.isChallenge && item.state.inProgress
        }"
        tabindex="0"
        :title="getTitle">
    <div class="img">
      <img v-if="item.isChallenge"
           :src="'https://www.bungie.net/' + item.icon" draggable="false"
           :alt="item.name" />
      <img v-else
           :src="'https://www.bungie.net/' + item.definition.displayProperties.icon" draggable="false"
           :alt="item.definition.displayProperties.name" />
    </div>
    <!-- <div v-if="item.isChallenge" class="challenge-status">
      <span v-if="item.complete" class="status completed">✓</span>
      <span v-else-if="item.state?.redeemable" class="status redeemable">!</span>
      <span v-else-if="hasProgress" class="status in-progress">↻</span>
    </div> -->
    <!-- <div class="name" v-if="item.isChallenge">{{ item.name }}</div> -->
    <div class="description" v-html="highlight(getDescription)"></div>
    <div v-if="item.isChallenge" class="objectives">
      <!-- Overall progress if multiple objectives -->
      <div v-if="item.objectiveProgress && item.objectiveProgress.total > 1"
           class="objective-summary"
           :class="{ completed: item.objectiveProgress.complete === item.objectiveProgress.total }">
        Overall Progress: {{ item.objectiveProgress.complete }}/{{ item.objectiveProgress.total }}
      </div>
      <!-- Individual objectives -->
      <div v-if="item.objectives" class="objective-list">
        <div v-for="obj in item.objectives"
             :key="obj.hash"
             class="objective"
             :class="{
               completed: obj.complete,
               'in-progress': !obj.complete && obj.progress > 0
             }">
          <div class="objective-text">{{ obj.progressDescription }} ({{ obj.progress }}/{{ obj.completionValue }})</div>
          <div class="progress-bar-container">
            <div class="progress-bar"
                 :style="{ width: `${(obj.progress / obj.completionValue) * 100}%` }">
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="item.isChallenge && item.rewardItems && item.rewardItems.length > 0" class="rewards">
      <div class="rewards-header">Rewards:</div>
      <div v-for="reward in item.rewardItems"
           :key="reward.itemHash"
           class="reward-item">
        <img v-if="t(reward.itemHash)?.displayProperties?.icon"
             :src="'https://www.bungie.net/' + t(reward.itemHash).displayProperties.icon"
             :alt="t(reward.itemHash)?.displayProperties?.name || 'Reward'"
             class="reward-icon">
        <span class="reward-name">{{ t(reward.itemHash)?.displayProperties?.name || 'Unknown Reward' }}</span>
        <span v-if="reward.quantity > 1" class="reward-quantity">×{{ reward.quantity }}</span>
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
    t: { // Accept the t function as a prop
      type: Function,
      required: true
    }
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
  &.challenge {
    border: 1px solid #666;
    border-radius: 4px;
    padding: 4px;
    margin: 2px;
    background-color: rgba(0, 0, 0, 0.3);

    &.challenge-complete {
      border-color: #4CAF50;
      background-color: rgba(76, 175, 80, 0.1);
    }

    &.challenge-redeemable {
      border-color: #FFC107 !important;
      background-color: rgba(255, 193, 7, 0.1);
      animation: pulse 2s infinite;
    }

    &.challenge-in-progress {
      border-color: #2196F3;
      background-color: rgba(33, 150, 243, 0.1);
    }
  }

  max-width: 260px;
  min-width: 160px;
  width: 30vw;
  display: inline-block;
  position: relative;
  overflow: hidden;
  user-select: none;

  * {
    overflow-wrap: break-word;
    font-size: small;
    user-select: none;
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

  .objectives {
    margin-top: 8px;

    .objective-summary {
      margin-bottom: 8px;
      padding: 4px;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      color: #aaa;

      &.completed {
        color: #4CAF50;
      }
    }

    .objective-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .objective {
      margin: 0;
      font-size: 0.9em;
      color: #aaa;

      &.completed {
        color: #4CAF50;
        .progress-bar { background-color: #4CAF50; }
      }

      &.in-progress {
        color: #2196F3;
        .progress-bar { background-color: #2196F3; }
      }

      .objective-text {
        margin-bottom: 2px;
      }

      .progress-bar-container {
        position: relative;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;

        .progress-bar {
          height: 100%;
          transition: width 0.3s ease;
        }
      }
    }
  }
  .rewards {
    margin-top: 8px;
    text-align: left;
    
    .rewards-header {
      color: #aaa;
      font-size: 0.9em;
      margin-bottom: 4px;
    }
    
    .reward-item {
      display: flex;
      align-items: center;
      margin-bottom: 2px;
      
      .reward-icon {
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
      
      .reward-name {
        color: #e0e0e0;
        font-size: 0.9em;
      }
      
      .reward-quantity {
        color: #aaa;
        font-size: 0.9em;
        margin-left: 4px;
      }
    }
  }
}
</style>

<style>
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
}
</style>