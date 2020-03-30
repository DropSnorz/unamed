<template>
  <div style="height:100%;">
    <vue-command
      :yargs-options="{ alias: { color: ['colour'] } }"
      :commands="commands"
      show-intro
      show-help
      title="root@world"
      prompt="root@world"
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
  data: () => ({
    commands: {
      // yargs arguments
      init: async () => (await import(`./../commands/InitCommand.vue`)).default,

      help: () => `Usage: init [option]<br><br>
        Example: init --seed myCustomSeed
      `
    }
  })
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
