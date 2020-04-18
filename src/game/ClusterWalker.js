import playerJournal from './PlayerJournal'

class ClusterWalker {

  setCluster(cluster) {
    this.cluster = cluster;
  }

  walk(system) {
    this.currentSystem = system;
    playerJournal.visit(system.constellation.name)
    playerJournal.visit(system.name)
  }

  getCurrentSystem() {
    return this.currentSystem;
  }

}

let clusterWalker = new ClusterWalker()

export default clusterWalker;