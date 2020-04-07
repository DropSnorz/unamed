<template>
  <div>
    <p>Scan results for {{ systemName }}</p>
    <ul>
      <li v-for="planet in planets" :key="planet.name">{{ planet.name }}</li>
    </ul>
    <ul>
      <li v-for="system in systems" :key="system.name">{{ system.name }}</li>
    </ul>
    <ul>
      <li v-for="constellation in constellations" :key="constellation.name">{{ constellation.name }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "ScanCommand",
  data: function() {
    return {
      planets: [],
      systems: [],
      constellations: [],
      systemName: ""
    };
  },
  mounted() {
    this.$nextTick(function() {
      let currentSystem = this.$store.state.player.currentSystem;
      this.systemName = currentSystem.name;

      let planets = [];
      for (let planet of currentSystem.planets) {
        planets.push(planet);
      }
      this.planets = planets;

      let systems = [];
      for (let system of currentSystem.constellation.systems) {
        systems.push(system);
      }
      this.systems = systems;

      let constellations = [];
      for (let constellation of currentSystem.constellation.paths) {
        constellations.push(constellation);
      }
      this.constellations = constellations;

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