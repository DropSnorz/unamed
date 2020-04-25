<template>
  <div>
    <div>
      <span>Something is about to happen...</span>
      <span class="text-secondary">(Procedurally generating the universe using seed {{ seed }})</span>
    </div>
    <div v-if="commandTick > 3000">
      <span>An intense light springs from the void.</span>
      <span
        class="text-secondary"
      >({{ systemCount }} stars generated over {{ constellationCount }} constellations)</span>
    </div>
    <div v-if="commandTick > 6000">
      <span>Time is completely distorted.</span>
      <span class="text-secondary">
        (
        {{ clusterSize }}
        cluster genrated in
        {{ clusterGenerationTime }} s )
      </span>
    </div>
    <div v-if="commandTick >= 8000">
      <span>
        In an instant, everything seems to stabilize. Everything is calm again.
        <br />This is where you wake up. You are confused, with memories of past lives.
        This terminal stands in front of you.
      </span>
    </div>
  </div>
</template>

<script>
import sizeof from 'object-sizeof';
import ClusterGenerator from './../game/ClusterGenerator';
import CommandMixin from './CommandMixin';
import clusterWalker from './../game/ClusterWalker';
import clusterRuleSet from './../game/RuleSet';

export default {
  name: 'InitCommand',
  mixins: [CommandMixin],
  inject: ['terminate'],
  data: function() {
    return {
      clusterGenerationTime: null,
      clusterSize: 0,
      constellationCount: 0,
      systemCount: 0
    };
  },
  computed: {
    seed: function() {
      return this.context.parsed.seed ? this.context.parsed.seed : '?';
    }
  },
  mounted() {
    this.$nextTick(function() {
      let r = clusterRuleSet();
      if (this.context.parsed.size) {
        r.cluster.size.min = this.context.parsed.size;
        r.cluster.size.max = this.context.parsed.size;
      }

      let generationStartTime = new Date().getTime();
      let clusterGenerator = new ClusterGenerator(this.context.parsed.seed, r);
      let cluster = clusterGenerator.generate();

      this.clusterGenerationTime = (
        (new Date().getTime() - generationStartTime) /
        1000
      ).toFixed(2);

      this.constellationCount = cluster.constellations.length;
      this.systemCount = cluster.constellations.reduce(
        (x, constellation) => x + constellation.systems.length,
        0
      );

      this.clusterSize = humanFileSize(sizeof(cluster));

      console.log(cluster);

      this.$store.dispatch(
        'player/setCurrentSystem',
        cluster.constellations[0].systems[0].name
      );
      this.$store.dispatch('world/initiate', true);
      clusterWalker.setCluster(cluster);
      clusterWalker.walk(cluster.constellations[0].systems[0]);

      this.startCommand(8000);
    });
  },
  watch: {
    commandCompleted: function() {
      if (this.commandCompleted) {
        this.terminate();
      }
    }
  }
};

function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}
</script>

<style scoped>
</style>