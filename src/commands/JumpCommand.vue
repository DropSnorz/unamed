<template>
  <div>
    <p>{{ commandProgressText }}</p>
  </div>
</template>

<script>
import CommandMixin from "./CommandMixin";
export default {
  name: "JumpCommand",
  mixins: [CommandMixin],
  data: function() {
    return {};
  },
  computed: {
    jumpTarget: function() {
      return this.$_arguments._[1];
    },
    commandProgressText: function() {
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
      this.startCommand(4000);
      let currentSystem = this.$store.state.player.currentSystem;
      for (let system of currentSystem.constellation.systems) {
        if (system.name == this.jumpTarget) {
          this.$store.dispatch("player/setCurrentSystem", system);
          return;
        }
      }
      for (let constellation of currentSystem.constellation.paths) {
        if (constellation.name == this.jumpTarget) {
          this.$store.dispatch(
            "player/setCurrentSystem",
            constellation.systems[0]
          );
          return;
        }
      }
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