<template>
  <div class="bounties section">
    <h2>Bounties & Challenges</h2>
    <table v-if="categorizedBounties.count.some(c => c > 0)">
      <thead>
        <tr>
          <th
            style="white-space: nowrap;"
          >
            <div>
              <span
                class="btn-unhide"
                @click="$emit('unhide-all-keywords')"
                :title="'Unhide Keywords'"
              >Unhide Kw.</span>
              (<span :style="{color: kwHidden ? 'red' : 'silver'}">{{kwHidden}}</span>)
            </div>
            <div>
              <span
                class="btn-unhide"
                @click="$emit('unhide-all')"
                :title="'Unhide Activities'"
              >Unhide Act.</span>
              (<span :style="{color: actHidden ? 'red' : 'silver'}">{{actHidden}}</span>)
            </div>
          </th>
          <th v-for="kw in [...filteredKeywords]" :key="kw">
           <div>
             {{kw}}
             <span v-if="symbols[kw]" :style="{color: symbols[kw].color}">{{symbols[kw].symbol}}</span>
             <span
               class="btn-hide"
               @click="$emit('hide-keyword', kw)"
               title="Hide this keyword"
             >❌</span>
           </div>
          </th>
          <th v-if="categorizedBounties.count[keywords.length] && !keywordsHidden['uncategorized']">
            <div>
              uncategorized
              <span
                class="btn-hide"
                @click="$emit('hide-keyword', 'uncategorized')"
                title="Hide uncategorized items"
              >❌</span>
            </div>
          </th>
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
          <td v-for="(kw, kwIdx) in keywords" v-if="categorizedBounties.count[kwIdx] && !keywordsHidden[kw]" :key="kwIdx">
            <Bounty
              v-for="(item) in categorizedBounties[category.toLowerCase()][kwIdx]"
              :key="item.isChallenge ? item.hash : item.itemInstanceId"
              :item="item"
              :keyword="kw"
            />
          </td>
          <td v-if="categorizedBounties.count[keywords.length] && !keywordsHidden['uncategorized']" class="lastTd">
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
    },
    keywordsHidden: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      symbols
    }
  },
  computed: {
    actHidden() {
      return Object.keys(this.activitiesHidden).length;
    },
    kwHidden() {
      return Object.keys(this.keywordsHidden).length;
    }
  }
}
</script>

<style scoped>
.btn-unhide {
  cursor: pointer;
  color: #007bff;
  margin-right: 4px;
}

.btn-unhide:hover {
  text-decoration: underline;
}

.btn-hide {
  cursor: pointer;
  opacity: 0.7;
  margin-left: 4px;
}

.btn-hide:hover {
  opacity: 1;
}

th > div {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px 0;
}
</style>