<template>
  <div class="bounties section">
    <h2>Bounties & Challenges</h2>
    <table v-if="categorizedBounties.count.some(c => c > 0)">
      <thead>
        <tr>
          <th
            style="white-space: nowrap;"
            :set="len = Object.keys(activitiesHidden).length"
            @click="$emit('unhide-all')"
          >
            <span class="btn-unhide">Unhide</span>
            (<span :style="{color: len ? 'red' : 'silver'}">{{len}}</span>)
          </th>
          <th v-for="kw in [...filteredKeywords]" :key="kw">
            {{kw}}
            <span v-if="symbols[kw]" :style="{color: symbols[kw].color}">{{symbols[kw].symbol}}</span>
          </th>
          <th v-if="categorizedBounties.count[keywords.length]">uncategorized</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(category, i) in filteredActivities" :key="category">
          <td>
            <div class="category-title">{{ category }}</div>
            <div
              v-if="i !== filteredActivities.length - 1"
              class="btn-hide"
              @click="$emit('hide-activity', category)"
            >❌</div>
          </td>
          <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx]" :key="kwIdx">
            <Bounty
              v-for="(item) in categorizedBounties[category.toLowerCase()][kwIdx]"
              :key="item.isChallenge ? item.hash : item.itemInstanceId"
              :item="item"
              :keyword="kw"
            />
          </td>
          <td v-if="categorizedBounties.count[keywords.length]" class="lastTd">
             <Bounty
              v-for="(item) in categorizedBounties[category.toLowerCase()][keywords.length]"
              :key="item.isChallenge ? item.hash : item.itemInstanceId"
              :item="item"
              keyword=""
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else>No active bounties or challenges found for this character.</div>
  </div>
</template>

<script>
import Bounty from './Bounty.vue';
import { symbols } from '../symbols';

export default {
  name: 'BountyTable',
  components: {
    Bounty
  },
  props: {
    categorizedBounties: {
      type: Object,
      required: true
    },
    keywords: {
      type: Array,
      required: true
    },
    filteredActivities: {
      type: Array,
      required: true
    },
    filteredKeywords: {
      type: Array,
      required: true
    },
    activitiesHidden: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      symbols
    }
  }
}
</script>