<template>
  <div style="height:100%;">
    <vue-command
      :commands="commands"
      :history="history"
      show-help
      :title="prompt"
      :prompt="prompt"
      :help-text="help"
      :parser="parser"
    />
  </div>
</template>

<script>
import VueCommand, { createStdout, createQuery } from 'vue-command';
import 'vue-command/dist/vue-command.css';
import getopts from 'getopts';
import { useWorldStore } from './../store/world';
import { usePlayerStore } from './../store/player';

export default {
  name: 'Console',
  components: {
    VueCommand
  },
  data() {
    return {
      history: [
        createStdout('Everything seems so empty...'),
        createQuery()
      ]
    };
  },
  computed: {
    commands() {
      if (!useWorldStore().initiated) {
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
      if (usePlayerStore().currentSystem) {
        return 'u@' + usePlayerStore().currentSystem + ':#';
      }
      return 'root@world';
    },
    help() {
      if (!useWorldStore().initiated) {
        return 'Type \'init\' to start playing or \'help\' for details'
      }
      return 'Type help'
    }
  },
  methods: {
    parser(query) {
      return getopts(query.trim().split(/\s+/));
    }
  }
};
</script>

<style lang="scss">
.vue-command {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #111;

  .vue-command__bar {
    background: #0a0f11;
  }
  .vue-command__history {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow-y: scroll;
  }
}
</style>
