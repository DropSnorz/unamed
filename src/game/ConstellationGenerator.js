import RandomGenerator from './RandomGenerator';

class ConstellationGenerator {
  constructor(seed) {
    this.randomValues = new RandomGenerator(seed);
  }

  generate(){
    return { name: "Constellation" }
  }

}

export default ConstellationGenerator