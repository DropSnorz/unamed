<template>
  <div style="height:100%;">
    <vue-command
      :commands="commands"
      show-intro
      show-help
      :title="prompt"
      :prompt="prompt"
    />
  </div>
</template>

<script>
import VueCommand from "vue-command";
import "vue-command/dist/vue-command.css";

export default {
  name: "Console",
  components: {
    VueCommand
  },
  computed: {
    commands() {
      if (!this.$store.state.world.initiated) {
        return {
          // yargs arguments
          init: async () =>
            (await import(`./../commands/InitCommand.vue`)).default,
          help: () => `Usage: init [option]<br><br>
          Example: init --seed myCustomSeed
          `
        };
      }
      return {
        // yargs arguments
        scan: async () =>
          (await import(`./../commands/ScanCommand.vue`)).default,
        init: async () =>
          (await import(`./../commands/InitCommand.vue`)).default,
        help: () => `scan: Scan surrounding area<br><br>`
      };
    },
    prompt() {
      if (this.$store.state.player.currentSystem) {
        return "u@" + this.$store.state.player.currentSystem.name + ":#";
      }
      return "root@world";
    }
  }
};
</script>

<style lang="scss">
.vue-command {
  height: 100%;
  .term-std {
    overflow-y: scroll;
  }
}
</style>
