import RandomGenerator from './RandomGenerator';
import SolarSystemGenerator from './SolarSystemGenerator';

class ConstellationGenerator {
  constructor(seed, ruleset) {
    this.r = ruleset;
    this.randomValues = new RandomGenerator(seed);
  }

  generate() {
    let constellation = {};
    constellation['name'] = this.createName();
    constellation['paths'] = []

    let nSystems = this.randomValues.randomGaussian(this.r.constellation.size.min, this.r.constellation.size.max, 0);
    let systems = [];
    constellation['systems'] = systems

    for (let i = 0; i < nSystems; i++) {
      systems.push(new SolarSystemGenerator(this.randomValues.random(), this.r, constellation).generate())
    }
    return constellation;
  }

  createName() {
    return this.randomValues.random().toString(36).slice(-this.randomValues.random(3, 4, 0))
  }

}

export default ConstellationGenerator