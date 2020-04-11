import RandomGenerator from './RandomGenerator'
import ConstellationGenerator from './ConstellationGenerator'

class ClusterGenerator {
  constructor(seed, ruleset) {
    this.r = ruleset
    this.randomValues = new RandomGenerator(seed)
  }

  generate() {
    let nConstellation = this.randomValues.randomGaussian(this.r.cluster.size.min, this.r.cluster.size.max, 0)
    let constellations = []

    for (let i = 0; i < nConstellation; i++) {
      let newConstellation = new ConstellationGenerator(this.randomValues.random(), this.r).generate()

      /* Really basic graph generation.
      * For each new node on the cluster we create n edges to already existing random nodes.
      *
      * Generated graph is not uniformly distributed since some nodes are present in the graph earlier. 
      * These nodes will tend to have higher degrees
      */
      if (i > 0) {
        // Generate 1 edge by default
        let pathEdges = 1
        // Generate a random number of edges once graph size reach 1/3
        if (constellations.length > nConstellation / 3) {
          pathEdges = this.randomValues.random(1, 2, 0)
        }
        // Create edges on current node
        for (let j = 0; j < pathEdges; j++) {
          let targetIndex = this.randomValues.random(0, constellations.length - 1, 0)
          let targetConstellation = constellations[targetIndex]

          // Prevent edge duplication on same nodes
          if (!newConstellation.paths.some(e => e.name === targetConstellation.name)) {
            newConstellation.paths.push(targetConstellation)
            targetConstellation.paths.push(newConstellation)
          }
        }
      }
      constellations.push(newConstellation)
    }


    return {
      name: "Main Cluster",
      constellations: constellations
    }
  }

}

export default ClusterGenerator