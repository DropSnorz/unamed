<template>
  <div>
    <div v-if="!commandCompleted">
      <p v-if="commandTick < 200">Initializing scanner...</p>
      <p v-else-if="commandTick < 300">Scanner ready</p>
      <p v-else-if="commandTick < 900">Scanning area...</p>
    </div>
    <div v-else>
      <p>Scan results for {{ systemName }}</p>
      <ul>
        <li v-for="planet in planets" :key="planet.name">{{ planet.name }}</li>
      </ul>
      <ul>
        <li v-for="system in systems" :key="system.name">{{ system.name }}</li>
      </ul>
      <ul>
        <li
          v-for="constellation in constellations"
          :key="constellation.name"
        >{{ constellation.name }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import CommandMixin from './CommandMixin';
import clusterWalker from './../game/ClusterWalker';

export default {
  name: 'ScanCommand',
  mixins: [CommandMixin],
  data: function() {
    return {
      planets: [],
      systems: [],
      constellations: [],
      systemName: ''
    };
  },
  mounted() {
    this.$nextTick(function() {
      this.startCommand(900);
      let currentSystem = clusterWalker.getCurrentSystem();
      this.systemName = currentSystem.name;

      let planets = [];
      for (let planet of currentSystem.planets) {
        planets.push(planet);
      }
      this.planets = planets;

      let systems = [];
      for (let system of currentSystem.constellation.systems) {
        if (system.name != currentSystem.name) {
          systems.push(system);
        }
      }
      this.systems = systems;

      let constellations = [];
      for (let constellation of currentSystem.constellation.paths) {
        constellations.push(constellation);
      }
      this.constellations = constellations;
    });
  },
  methods: {
    leave() {
      this.$_done();
    }
  },
  watch: {
    commandCompleted: function() {
      if (this.commandCompleted) {
        this.leave();
      }
    }
  }
};
</script>

<style scoped>
</style>