<template>
  <div id="app" class="container-fluid wrapper" style="height:100%;">
    <div class="row" style="height:100%;">
      <div class="col-md-10 p-0" style="height:100%;">
        <Console />
      </div>
      <nav class="col-md-2 sidebar d-xs-none d-xs-none d-sm-none d-md-block">
        <img class="logo rounded-circle mt-5" alt="space" src="./assets/space.png" />
        <h1 class="mt-3">Unamed</h1>
        <div class="sidebar-footer">
        <a href="https://github.com/Dropsnorz/unamed">Github</a>
        </div>
      </nav>
    </div>
  </div>
</template>

<script>
import Console from './components/Console.vue';

export default {
  name: 'App',
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

.sidebar {
  top: 0;
  bottom: 0;
  right: 0;
  z-index: 100;
  background-color: #131a1d;
  color: #c4dbe6;
  text-align: center;
  font-family: Inconsolata,monospace;
}
.sidebar-footer {
    position: absolute;
    bottom: 0;
    left:50%;
    transform: translate(-50%, -50%);
}

a:link {
  color: #c4dbe6;
}

a:visited {
  color: #c4dbe6;
}

.logo {
  width: 100px;
  height: 100px;
  border: 3px solid #c4dbe6;
}
</style>
