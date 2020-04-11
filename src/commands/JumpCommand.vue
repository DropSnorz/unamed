<template>
  <div>
    <p>{{ commandProgressText }}</p>
  </div>
</template>

<script>
import CommandMixin from "./CommandMixin";
import clusterWalker from './../game/ClusterWalker';
export default {
  name: "JumpCommand",
  mixins: [CommandMixin],
  data: function() {
    return {
      error: false
    };
  },
  computed: {
    jumpTarget: function() {
      return this.$_arguments._[1];
    },
    commandProgressText: function() {
      if(this.error) return this.error
      if (this.commandTick < 300) return "Checking propulsion systems...";
      if (this.commandTick < 500) return "Propulsion systems... OK";
      if (this.commandTick < 1500)
        return "Aligning to " + this.jumpTarget + "...";
      if (this.commandTick < 1700)
        return "Successfully aligned with " + this.jumpTarget;
      if (this.commandTick < 4000)
        return "Jumping to " + this.jumpTarget + "...";
      return "Jump complete ! Welcome to " + this.jumpTarget;
    }
  },
  mounted() {
    this.$nextTick(function() {
      let currentSystem = clusterWalker.getCurrentSystem();
      for (let system of currentSystem.constellation.systems) {
        if (system.name == this.jumpTarget) {
          this.$store.dispatch("player/setCurrentSystem", system.name);
          clusterWalker.walk(system);
          this.startCommand(4000);

          return;
        }
      }
      for (let constellation of currentSystem.constellation.paths) {
        if (constellation.name == this.jumpTarget) {
          this.$store.dispatch(
            "player/setCurrentSystem",
            constellation.systems[0].name
          );
          clusterWalker.walk(constellation.systems[0]);
          this.startCommand(4000);
          return;
        }
      }
      this.error = "Unknown jump target " + this.jumpTarget
      this.leave();
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