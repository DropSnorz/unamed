<template>
  <div>
    <p>Jumping to {{ jumpTarget }}</p>
  </div>
</template>

<script>
export default {
  name: "JumpCommand",
  data: function() {
    return {};
  },
  computed: {
    jumpTarget: function() {
      return this.$_arguments._[1];
    }
  },
  mounted() {
    this.$nextTick(function() {
      let currentSystem = this.$store.state.player.currentSystem;
      for (let system of currentSystem.constellation.systems) {
        if (system.name == this.jumpTarget) {
          this.$store.dispatch("player/setCurrentSystem", system);
          this.leave();
          return;
        }
      }
      for (let constellation of currentSystem.constellation.paths) {
        if (constellation.name == this.jumpTarget) {
          this.$store.dispatch(
            "player/setCurrentSystem",
            constellation.systems[0]
          );
          this.leave();
          return;
        }
      }
      this.leave();
    });
  },
  methods: {
    leave() {
      this.$_done();
    }
  }
};
</script>

<style scoped>
</style>