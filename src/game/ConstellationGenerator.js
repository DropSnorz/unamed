import RandomGenerator from './RandomGenerator';
import SolarSystemGenerator from './SolarSystemGenerator';

class ConstellationGenerator {
  constructor(seed) {
    this.randomValues = new RandomGenerator(seed);
  }

  generate(){

    let constellation = {};
    let nSystems = this.randomValues.randomGaussian(10,30,0);
    let systems = [];

    constellation["name"] = this.createName();
    constellation["systems"] = systems

    for(let i=0;i<nSystems;i++) {
      systems.push(new SolarSystemGenerator(this.randomValues.random(),constellation).generate())
    }
    
    return constellation;
  }

  createName(){
    return this.randomValues.random().toString(36).slice(-this.randomValues.random(3,4,0))
  }

}

export default ConstellationGenerator