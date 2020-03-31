<template>
  <p>Init world using seed {{ seed }}</p>
</template>

<script>
import ClusterGenerator from './../game/ClusterGenerator'
export default {
  name: "InitCommand",
  computed: {
    seed: function() {
      return this.$_arguments["seed"];
    }
  },
  mounted() {
    this.$nextTick(function() {
      let clusterGenerator = new ClusterGenerator(this.$_arguments["seed"])
      let cluster = clusterGenerator.generate()
      this.$store.dispatch('player/setCurrentSystem', cluster.constellations[0].systems[0].name)
      this.leave();
    });
  },
  methods: {
    leave() {
      this.$_done();
    },
    execute(command) {
      this.leave();
      this.$_executeCommand(command);
    }
  },
};
</script>

<style scoped>

</style>