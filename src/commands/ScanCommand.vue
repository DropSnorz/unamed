<template>
  <div>
    <div v-if="isHelp()">
      scan - Scan surrounding area
      Usage: scan
      <br />
      <br />
      <p>
        <strong>-h, --help</strong> Display help text
      </p>
    </div>
    <div v-else>
    <div v-if="!commandCompleted">
      <p v-if="commandTick < 200">Initializing scanner...</p>
      <p v-else-if="commandTick < 300">Scanner ready</p>
      <p v-else-if="commandTick < 900">Scanning area...</p>
    </div>
    <div v-else>
      <p>Scan results for {{ systemName }}:</p>
      <span>Nearby orbital bodies</span>
      <ul>
        <li v-for="planet in planets" :key="planet.name">{{ planet.name }}
        </li>
      </ul>
      <span>Reachable Stars</span>
      <ul>
        <li v-for="system in systems" :key="system.name">{{ system.name }}
          <span v-if="playerJournal.isVisited(system.name)" class="text-secondary"> [visited] </span>
        </li>
      </ul>
      <span>Constellation Signatures</span>
      <ul>
        <li
          v-for="constellation in constellations"
          :key="constellation.name"
        >{{ constellation.name }}
          <span v-if="playerJournal.isVisited(constellation.name)" class="text-secondary"> [visited] </span>
        </li>
      </ul>
    </div>
    </div>
  </div>
</template>

<script>
import CommandMixin from './CommandMixin';
import clusterWalker from './../game/ClusterWalker';
import playerJournal from './../game/PlayerJournal';

export default {
  name: 'ScanCommand',
  mixins: [CommandMixin],
  inject: ['terminate'],
  data: function() {
    return {
      planets: [],
      systems: [],
      constellations: [],
      systemName: '',
      playerJournal: playerJournal
    };
  },
  mounted() {
    this.$nextTick(function() {
      if(this.isHelp()){
        this.terminate();
        return;
      }
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
  watch: {
    commandCompleted: function() {
      if (this.commandCompleted) {
        this.terminate();
      }
    }
  }
};
</script>

<style scoped>
</style>