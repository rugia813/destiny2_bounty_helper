<template>
  <div class="character-row">
    <CharSelect
      :activeId="characterId"
      :characters="characters"
      @change="onCharacterChange"
    />
    <div class="controls">
      <!-- Refresh -->
      <span class="refresh" @click="refresh">{{refreshing ? 'Refreshing' : 'Refresh'}}</span>

      <!-- Config -->
      <Config
        :activities="activities"
        :keywords="keywords"
        @update:activities="$emit('update:activities', $event)"
        @update:keywords="$emit('update:keywords', $event)"
        @reset-activities="$emit('reset-activities')"
        @reset-keywords="$emit('reset-keywords')"
      />
    </div>

    <div class="right-panel">
      <!-- Contact -->
      <div class="contact" title="Github">
        <a href="https://github.com/rugia813/destiny2_bounty_helper" target="tab" alt="Link to source code at Github">GitHub</a>
      </div>
    </div>
  </div>
</template>

<script>
import CharSelect from './CharSelect.vue';
import Config from './Config.vue';

export default {
  name: 'Header',
  components: {
    CharSelect,
    Config
  },
  props: {
    characterId: {
      type: String,
      required: true
    },
    characters: {
      type: Object,
      required: true
    },
    refreshing: {
      type: Boolean,
      required: true
    },
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
    onCharacterChange(characterId) {
      this.$emit('character-change', characterId);
    },
    refresh() {
      if (!this.refreshing) {
        this.$emit('refresh');
      }
    }
  }
}
</script>