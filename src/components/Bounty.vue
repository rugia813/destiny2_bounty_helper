<template>
  <span class="hello">
    <div><img :src="'https://www.bungie.net/'+item.displayProperties.icon" /></div>
    <h3>{{ item.displayProperties.name }}</h3>
    <div>{{ item.displayProperties.description }}</div>
    <div>{{ item.inventory.stackUniqueLabel }}</div>
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