<template>
  <div>
    <div v-if="isHelp()">
      jump - Jump to a nearby signature
      Usage: jump TARGET
      <br />
      <br />
      <p>
        <strong>-h, --help</strong> Display help text
      </p>
    </div>
    <div v-else>
      <div v-if="error">
        <p>{{ error }}</p>
      </div>
      <div v-else>
        <p v-if="commandTick < 300">Checking propulsion systems...</p>
        <p v-else-if="commandTick < 500">hecking propulsion systems...OK</p>
        <p v-else-if="commandTick < 1500">Aligning to {{ jumpTarget }}...</p>
        <p v-else-if="commandTick < 1700">Successfully aligned with {{ jumpTarget }}</p>
        <p v-else-if="commandTick < 4000">Jumping to {{ jumpTarget }}...</p>
        <p v-else>Jump complete ! Welcome to {{ jumpTarget }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import CommandMixin from './CommandMixin';
import clusterWalker from './../game/ClusterWalker';
export default {
  name: 'JumpCommand',
  mixins: [CommandMixin],
  inject: ['terminate'],
  data: function() {
    return {
      error: false
    };
  },
  computed: {
    jumpTarget: function() {
      return this.context.parsed._[1];
    }
  },
  mounted() {
    this.$nextTick(function() {
      if (this.isHelp()) {
        this.terminate();
        return;
      }
      let currentSystem = clusterWalker.getCurrentSystem();
      for (let system of currentSystem.constellation.systems) {
        if (system.name == this.jumpTarget) {
          this.$store.dispatch('player/setCurrentSystem', system.name);
          clusterWalker.walk(system);
          this.startCommand(4000);

          return;
        }
      }
      for (let constellation of currentSystem.constellation.paths) {
        if (constellation.name == this.jumpTarget) {
          this.$store.dispatch(
            'player/setCurrentSystem',
            constellation.systems[0].name
          );
          clusterWalker.walk(constellation.systems[0]);
          this.startCommand(4000);
          return;
        }
      }
      this.error = 'Unknown jump target ' + this.jumpTarget;
      this.terminate();
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