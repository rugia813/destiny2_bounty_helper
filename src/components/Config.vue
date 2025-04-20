<template>
  <div class="config-panel">
    Config
    <div class="bubble">
      <div>
        Activities
        <span tabindex="0" class="hint" title="hover over a bounty to see its full key, enter the segment that represents the activity.">❔</span>
        <span class="reset" @click="resetActivities">reset</span>
        <textarea ref="actConfig" @change="parseActivities" :value="activities.join(',')"></textarea>
      </div>
      <div>
        Keywords
        <span tabindex="0" class="hint" title="keywords to be searched in bounties' description.">❔</span>
        <span class="reset" @click="resetKeywords">reset</span>
        <textarea ref="actKeywords" @change="parseKeywords" :value="keywords.join(',')"></textarea>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Config',
  props: {
    activities: {
      type: Array,
      required: true
    },
    keywords: {
      type: Array,
      required: true
    }
  },
  methods: {
    parseActivities(e) {
      const value = e.target.value.trim();
      const activities = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.$emit('update:activities', activities);
    },
    parseKeywords(e) {
      const value = e.target.value.trim();
      const keywords = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
      this.$emit('update:keywords', keywords);
    },
    resetActivities() {
      this.$emit('reset-activities');
    },
    resetKeywords() {
      this.$emit('reset-keywords');
    }
  }
}
</script>