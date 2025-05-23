<template>
  <div class="bounties section">
    <div class="header">
      <!-- <h2>Bounties & Challenges</h2> -->
    </div>
    <div class="table-container" ref="container" @mousedown.capture="startPan" @mousemove="pan" @mouseup="stopPan" @mouseleave="stopPan">
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
              v-for="item in filteredItems(categorizedBounties[category.toLowerCase()][kwIdx])"
              :key="item.isChallenge ? item.hash : item.itemInstanceId"
              :item="item"
              :keyword="kw"
              :t="t"
            />
          </td>
          <td v-if="categorizedBounties.count[keywords.length] && !keywordsHidden['uncategorized']" class="lastTd">
             <Bounty
              v-for="item in filteredItems(categorizedBounties[category.toLowerCase()][keywords.length])"
              :key="item.isChallenge ? item.hash : item.itemInstanceId"
              :item="item"
              keyword=""
              :t="t"
            />
          </td>
        </tr>
      </tbody>
      </table>
      <div v-else>No active bounties or challenges found for this character.</div>
    </div>
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
    },
    showBounties: {
      type: Boolean,
      required: true
    },
    showChallenges: {
      type: Boolean,
      required: true
    },
    t: { // Accept the t function as a prop
      type: Function,
      required: true
    }
  },
  data() {
    return {
      symbols,
      isPanning: false,
      lastX: 0,
      lastY: 0
    }
  },
  methods: {
    filteredItems(items) {
      if (!items) return [];
      return items.filter(item => {
        if (item.isChallenge) return this.showChallenges;
        return this.showBounties;
      });
    },
    startPan(e) {
      if (e.target.closest('.btn-hide, .btn-unhide')) return;
      this.isPanning = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.$refs.container.style.cursor = 'grabbing';
    },
    pan(e) {
      if (!this.isPanning) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      const container = this.$refs.container;
      container.scrollLeft -= dx;
      container.scrollTop -= dy;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    },
    stopPan() {
      this.isPanning = false;
      this.$refs.container.style.cursor = 'grab';
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

<style lang="scss" scoped>
.header {
  display: flex;
  /* justify-content: space-between; */
  gap: 16px;
  align-items: center;
  /* margin-bottom: 1rem; */
}

h2 {
  margin-bottom: 0;
}

// Bounty Table Styles
.bounties {
  // Adjust flex basis if needed, e.g., make it wider by default
  flex-basis: 60%;
  padding: 0;
  overflow: hidden;
  position: relative;
  // Create a new stacking context with lower z-index
  z-index: 0;
  max-width: 100vw;

  * {
    user-select: none; // Prevent text selection on drag
  }

  table {
    width: 100%;
    border-collapse: collapse; // Cleaner look
    font-size: 0.9em; // Slightly smaller font for table data
  }
  th, td {
    border: 1px solid #555; // Slightly darker border
    padding: 6px 8px; // Adjust padding
    text-align: left;
    vertical-align: top; // Align content to top
  }
  th {
    background-color: #333; // Darker header background
    cursor: default;
  }
  thead th:first-child { // Style the unhide button header
      cursor: pointer;
      &:hover .btn-unhide { text-decoration: underline; }
  }
  .btn-unhide { color: #8f8; } // Greenish color for unhide
  .category-title {
      font-weight: bold;
      margin-bottom: 5px;
  }
  .btn-hide {
    cursor: pointer;
    color: #f88; // Reddish color for hide
    font-size: 0.8em;
    float: right;
    &:hover { color: red; }
  }
  td.lastTd { // Style uncategorized column if needed
    display: flex;
    flex-wrap: wrap;
    width: 660px;
  }
}


.table-container {
  max-width: 100%;
  overflow: auto;
  cursor: grab;
  position: relative;
  max-height: calc(100vh - 90px); // Adjust height as needed
}

@media (max-width: 768px) {
  .table-container {
    cursor: default;
  }
}

/* Sticky headers */
thead th {
  position: sticky;
  top: 0;
  background: #333;
  z-index: 1;
}

tbody td:first-child {
  position: sticky;
  left: 0;
  background: #333;
  z-index: 0;
}

/* Corner cell (first header cell) */
thead th:first-child {
  z-index: 2;
  background: #333;
}

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