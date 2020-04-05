import RandomGenerator from './RandomGenerator';
import Utils from './Utils'

class SolarSystemGenerator {
  constructor(seed, constellation) {
    this.randomValues = new RandomGenerator(seed);
    this.constellation = constellation;
  }

  generate() {
    let solarSystem = {
      name: this.createName(),
      constellation: this.constellation,
      planets: []
    }

    let nPlanets = this.randomValues.randomGaussian(2, 10, 0);
    for (let i = 0; i < nPlanets; i++) {
      solarSystem.planets.push(this.createPlanet(i + 1))
    }
    return solarSystem
  }

  createName() {
    return this.constellation.name + "-" + this.randomValues.random().toString(36).slice(-this.randomValues.random(3, 4, 0))
  }

  createPlanet(planetIndex) {
    let planetTypes = ["Barren", "Ice", "Lava", "Oceanic", "Plasma", "Temperate", "Gas"]
    let typeIndex = this.randomValues.random(0, planetTypes.length, 0);
    let type = planetTypes[typeIndex]
    return {
      name: "Planet " + Utils.romanize(planetIndex) + " (" + type + ")",
      type: type
    }
  }

}

export default SolarSystemGenerator