<template>
  <div>
    <p>{{ commandProgressText }}</p>
    <div v-if="commandCompleted">
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
import CommandMixin from "./CommandMixin";
export default {
  mixins: [CommandMixin],
  name: "ScanCommand",
  data: function() {
    return {
      planets: [],
      systems: [],
      constellations: [],
      systemName: ""
    };
  },
  computed: {
    commandProgressText: function() {
      if (this.commandTick < 200) return "Initializing scanner";
      if (this.commandTick < 300) return "Scanner ready";
      if (this.commandTick < 900) return "Scanning area...";
      return "Scan results for " + this.systemName;
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.startCommand(900);
      let currentSystem = this.$store.state.player.currentSystem;
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