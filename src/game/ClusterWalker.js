class ClusterWalker {

  setCluster(cluster) {
    this.cluster = cluster;
  }

  walk(system) {
    this.currentSystem = system;
  }

  getCurrentSystem() {
    return this.currentSystem;
  }

}

let clusterWalker = new ClusterWalker()

export default clusterWalker;