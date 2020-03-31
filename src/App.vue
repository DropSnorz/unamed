<template>
  <div id="app" class="container-fluid wrapper" style="height:100%;">
    <Console />
  </div>
</template>

<script>
import Console from "./components/Console.vue";

export default {
  name: "App",
  components: {
    Console
  }
};
</script>

<style>
html,
body {
  height: 100%;
}
</style>
