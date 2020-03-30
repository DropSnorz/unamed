import RandomGenerator from './RandomGenerator';

class SolarSystemGenerator {
  constructor(seed, constellation) {
    this.randomValues = new RandomGenerator(seed);
    this.constellation = constellation;
  }

  generate(){
    
    return { name: this.createName()}
  }

  createName(){
    return this.constellation.name + "-" + this.randomValues.random().toString(36).slice(-this.randomValues.random(3,4,0))
  }

}

export default SolarSystemGenerator