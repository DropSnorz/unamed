<template>
  <p>Init world using seed {{seed}}</p>
</template>

<script>
export default {
  name: "init",
  methods: {
    leave() {
      this.$_done();
    },
    execute(command) {
      this.leave();
      this.$_executeCommand(command);
    }
  },
  computed: {
    seed: function() {
      return this.$_arguments["seed"];
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.leave();
    });
  }
};
</script>
