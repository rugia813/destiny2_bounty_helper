<template>
  <span class="hello">
    <div><img :src="'https://www.bungie.net/'+item.displayProperties.icon" /></div>
    <h3>{{ item.displayProperties.name }}</h3>
    <div style="display:inline;">{{ item.displayProperties.description }}</div>
  </span>
</template>

<script>
export default {
  name: 'Bounty',
  props: {
    item: {}
  }
}
</script>