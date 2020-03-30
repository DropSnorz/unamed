import RandomGenerator from './RandomGenerator';
import ConstellationGenerator from './ConstellationGenerator';

class ClusterGenerator {
  constructor(seed) {
    this.randomValues = new RandomGenerator(seed);
  }

  generate(){
    let nConstellation = this.randomValues.randomGaussian(10,20,0);
    let constellations = []

    for(let i=0;i<nConstellation;i++) {
      constellations.push(new ConstellationGenerator(this.randomValues.random()).generate())
    }

    return {name: "Main Cluster",
     constellations: constellations
    }
  }

}

export default ClusterGenerator