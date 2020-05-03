<template>
  <div style="height:100%;">
    <vue-command
      intro="Everything seems so empty..."
      :commands="commands"
      :executed="new Set()"
      show-intro
      show-help
      :title="prompt"
      :prompt="prompt"
      :help-text="help"
    />
  </div>
</template>

<script>
import VueCommand, { createStdout } from 'vue-command';
import 'vue-command/dist/vue-command.css';

export default {
  name: 'Console',
  components: {
    VueCommand
  },
  computed: {
    commands() {
      if (!this.$store.state.world.initiated) {
        return {
          // yargs arguments
          init: async () =>
            (await import('./../commands/InitCommand.vue')).default,
          help: () => createStdout(`
          init: Create a new cluster<br />
          help: Display help text<br />
          Use 'command --help' or 'command -h' for details<br />
          `)
        };
      }
      return {
        // yargs arguments
        scan: async () =>
          (await import('./../commands/ScanCommand.vue')).default,
        jump: async () =>
          (await import('./../commands/JumpCommand.vue')).default,
        init: async () =>
          (await import('./../commands/InitCommand.vue')).default,
        help: () => createStdout(`
          scan: Scan surrounding area<br />
          jump: Jump to a nearby signature<br />
          Use 'command --help' or 'command -h' for details<br />
          `)
      };
    },
    prompt() {
      if (this.$store.state.player.currentSystem) {
        return 'u@' + this.$store.state.player.currentSystem + ':#';
      }
      return 'root@world';
    },
    help() {
      if (!this.$store.state.world.initiated) {
        return 'Type \'init\' to start playing or \'help\' for details'
      }
      return 'Type help'
    }
  }
};
</script>

<style lang="scss">
.vue-command {
  height: 100%;
  display: flex; 
  flex-direction: column; 

  .term-bar {
    background: #0a0f11;
  }
  .term {
    display: flex;
    flex: 1;
    overflow-y: scroll;
    background: #05080a;
  }
}
</style>
