<template>
  <div class="config-panel" v-click-outside="closeDropdown">
    <div class="config-trigger" @click="toggleDropdown">
      <span>Settings</span>
      <span class="config-icon" :class="{ 'is-active': isOpen }">⚙️</span>
    </div>
    <transition name="dropdown">
      <div class="bubble" v-if="isOpen">
      <div class="config-section">
        <div class="section-header">
          <span class="section-title">Activities</span>
          <span tabindex="0" class="hint" title="Hover over a bounty to see its full key, enter the segment that represents the activity.">❔</span>
        </div>
        <textarea
          ref="actConfig"
          @change="parseActivities"
          :value="activities.join(',')"
          placeholder="Enter activity names..."
        ></textarea>
        <button class="reset-btn" @click="resetActivities">Reset Activities</button>
      </div>
      <div class="config-section">
        <div class="section-header">
          <span class="section-title">Keywords</span>
          <span tabindex="0" class="hint" title="Keywords to be searched in bounties' description.">❔</span>
        </div>
        <textarea
          ref="actKeywords"
          @change="parseKeywords"
          :value="keywords.join(',')"
          placeholder="Enter keywords..."
        ></textarea>
        <button class="reset-btn" @click="resetKeywords">Reset Keywords</button>
      </div>
      </div>
    </transition>
  </div>
</template>

<script>
const clickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  }
};

export default {
  name: 'Config',
  directives: {
    clickOutside
  },
  data() {
    return {
      isOpen: false
    };
  },
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
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },
    closeDropdown() {
      this.isOpen = false;
    },
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

<style scoped>
.config-panel {
  cursor: default;
  position: relative;
  padding: 5px;
}

.config-trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.config-trigger:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.config-icon {
  font-size: 1.1em;
  transition: transform 0.3s ease;
}

.config-icon.is-active {
  transform: rotate(180deg);
}

.bubble {
  position: absolute;
  border: 1px solid #666;
  background: rgb(35, 35, 35);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 380px;
  z-index: 10;
  color: silver;
}

.config-section {
  margin-bottom: 20px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-weight: 600;
  color: #eee;
  font-size: 0.95em;
}

.hint {
  cursor: help;
  font-size: 0.8em;
  margin-left: 6px;
  color: #999;
  border: 1px solid #666;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.hint:hover {
  color: #fff;
  border-color: #999;
  background: rgba(255, 255, 255, 0.1);
}

textarea {
  width: 100%;
  min-height: 170px;
  height: max-content;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid #444;
  border-radius: 4px;
  color: #eee;
  margin: 5px 0;
  font-size: 0.9em;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #666;
  background-color: rgba(0, 0, 0, 0.3);
}

.reset-btn {
  background: rgba(80, 80, 80, 0.3);
  border: 1px solid #444;
  color: #aaa;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: rgba(100, 100, 100, 0.3);
  border-color: #666;
  color: #fff;
}
</style>