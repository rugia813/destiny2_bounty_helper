<template>
	<div class="characters" :class="{expand}">

		<span
			class="character"
			:class="{ active: character.characterId === activeId }"
			:style="{
				position: i === 0 ? null : 'absolute',
				top: `${i * 100}px`
			}"
			v-for="(character, i) in charArr" :key="character.characterId"
			@click="click(character.characterId)"
		>
			<img :src="'https://www.bungie.net/'+character.emblemBackgroundPath" :alt="character.classType" />
			<div class="class">{{['Titan', 'Hunter', 'Warlock'][character.classType]}}</div>
			<div class="light">{{character.light}}</div>
		</span>

	</div>
</template>

<script>
export default {
  name: 'CharacterSelect',
  props: {
		activeId: { type: String },
		characters: { type: Object },
  },
	data() {
		return {
			expand: false,
		}
	},
  methods: {
		click(characterId) {
			if (this.expand) {
				this.$emit('change', characterId)
			}
			this.expand = !this.expand
		}
  },
	computed: {
		charArr() {
			let i = 1
			const arr = []
			for (const id in this.characters) {
				const char = this.characters[id]
				if (id === this.activeId) {
					arr[0] = char
				} else {
					arr[i++] = char
				}
			}
			return arr
		}
	}
}
</script>

<style lang="scss">
.characters {
	display: flex;
	flex-direction: column;
	position: relative;

  * {
    cursor: pointer;
  }

	&.expand {
		.character {
    	display: inline-block;
			overflow: visible;
			width: 100%;
			.class,.light {
				display: inline-block;
			}
		}
	}

  .character {
    display: none;
    position: relative;
    zoom: 0.8;
		transition: top .1s ease-out;
		z-index: 9999;

		&:hover {
			filter: brightness(1.2);
		}

		&.active {
    	display: inline-block;
		}

		img {
			width: 474px;
			height: 96px;
		}

    .class {
      position: absolute;
      left: 22%;
      top: 8%;
      color: white;
      font-size: x-large;
      font-weight: bold;
    }
    .light {
      position: absolute;
      right: 5%;
      top: 8%;
      color: cyan;
      font-size: xx-large;
      font-weight: bold;
    }
  }

  @media (max-width: 768px) {
    .character {
      width: 64px;
			height: 64px;
			overflow: hidden;
      .class,.light {
        display: none;
      }
    }
  }
}
</style>