<template>
  <div>
    <p>Scan results for {{ systemName }}</p>
    <ul>
      <li v-for="planet in planets" :key="planet.name">{{ planet.name }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "ScanCommand",
  data: function() {
    return {
      planets: [],
      systemName: ""
    };
  },
  mounted() {
    this.$nextTick(function() {
      let planets = [];
      let currentSystem = this.$store.state.player.currentSystem;
      this.systemName = currentSystem.name;
      for (let planet of currentSystem.planets) {
        planets.push(planet);
      }
      this.planets = planets;
      this.leave();
    });
  },
  methods: {
    leave() {
      this.$_done();
    }
  }
};
</script>

<style scoped>
</style>