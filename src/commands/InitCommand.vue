<template>
  <div>
    <div>
      <span>Something is about to happen...</span>
      <span class="text-secondary">(Procedurally generating the universe using seed {{seed}})</span>
    </div>
    <div v-html="commandProgressText"></div>
    <div v-html="commandStatusText"></div>
    <div v-html="commandEndText"></div>
  </div>
</template>

<script>
import sizeof from "object-sizeof";
import ClusterGenerator from "./../game/ClusterGenerator";
import CommandMixin from "./CommandMixin";
import clusterWalker from "./../game/ClusterWalker";
export default {
  name: "InitCommand",
  mixins: [CommandMixin],
  data: function() {
    return {
      clusterGenerationTime: null,
      clusterSize: 0,
      systemCount: 0
    };
  },
  computed: {
    seed: function() {
      return this.$_arguments["seed"] ? this.$_arguments["seed"] : "?";
    },
    commandProgressText: function() {
      if (this.commandTick < 3000) return "";
      return (
        `<span>An intense light springs from the void.</span> 
        <span class="text-secondary">(` +
        this.systemCount +
        ` stars generated)</span>`
      );
    },
    commandStatusText: function() {
      if (this.commandTick < 6000) return "";
      return (
        `<span>Time is completely distorted.</span> 
        <span class="text-secondary">(` +
        humanFileSize(this.clusterSize) +
        ` cluster genrated in ` +
        this.clusterGenerationTime +
        `s )</span>`
      );
    },
    commandEndText: function() {
      if (this.commandTick < 8000) return "";
      return `<span> In an instant, everything seems to stabilize. Everything is calm again. <br />
        This is where you wake up. You are confused, with memories of past lives.
        This terminal stands in front of you.</span>`;
    }
  },
  mounted() {
    this.$nextTick(function() {
      let generationStartTime = new Date().getTime();
      let clusterGenerator = new ClusterGenerator(this.$_arguments["seed"]);
      let cluster = clusterGenerator.generate();

      this.clusterGenerationTime = (
        (new Date().getTime() - generationStartTime) /
        1000
      ).toFixed(2);

      this.systemCount = cluster.constellations.reduce(
        (x, constellation) => x + constellation.systems.length,
        0
      );

      this.clusterSize = sizeof(cluster);

      console.log(cluster);

      this.$store.dispatch(
        "player/setCurrentSystem",
        cluster.constellations[0].systems[0].name
      );
      this.$store.dispatch("world/initiate", true);

      clusterWalker.setCluster(cluster);
      clusterWalker.walk(cluster.constellations[0].systems[0]);

      this.startCommand(8000);
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
  watch: {
    commandCompleted: function() {
      if (this.commandCompleted) {
        this.leave();
      }
    }
  }
};

function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  var units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
}
</script>

<style scoped>
</style>