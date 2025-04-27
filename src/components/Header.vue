<template>
  <div class="character-row">
    <CharSelect
      :activeId="characterId"
      :characters="characters"
      @change="onCharacterChange"
    />
    <div class="controls">
      <!-- Refresh -->
      <div class="refresh-controls">
        <span class="refresh" @click="refresh">{{refreshing ? 'Refreshing' : 'Refresh'}}</span>
        <label class="auto-refresh">
          <input
            type="checkbox"
            :checked="autoRefreshEnabled"
            @change="$emit('update-auto-refresh', $event.target.checked)"
          />
          <span>Auto</span>
        </label>
      </div>

      <!-- Config -->
      <Config
        :activities="activities"
        :keywords="keywords"
        @update:activities="$emit('update:activities', $event)"
        @update:keywords="$emit('update:keywords', $event)"
        @update-visibility="$emit('update-visibility', $event)"
        @update-auto-refresh="$emit('update-auto-refresh', $event)"
        @reset-activities="$emit('reset-activities')"
        @reset-keywords="$emit('reset-keywords')"
      />
    </div>

    <div class="right-panel">
      <!-- Contact -->
      <div class="contact" title="Github">
        <a href="https://github.com/rugia813/destiny2_bounty_helper" target="tab" alt="Link to source code at Github"><img alt="github" src="@/assets/github.svg" /></a>
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
    },
    autoRefreshEnabled: {
      type: Boolean,
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

<style lang="scss" scoped>
.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh {
  cursor: pointer;
  color: #007bff;
  &:hover {
    text-decoration: underline;
  }
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  cursor: pointer;
  font-size: 0.9em;
  color: #eee;

  input[type="checkbox"] {
    cursor: pointer;
  }

  &:hover {
    color: #fff;
  }
}
</style>