import seedrandom from 'seedrandom';

class RandomGenerator {
  constructor(seed) {
    this.seed = seed
    this.predictable = seedrandom(seed)
  }

  random(min=0, max=1, precision) {

    let rand = this.rescale(this.predictable(), min, max)

    if(precision != undefined){
      return this.round(rand, precision)
    }

    return rand;

  }

  randomGaussian(min=0, max=1, precision){
    let rand = (this.predictable() + this.predictable() + this.predictable() + this.predictable() + this.predictable() + this.predictable()) / 6;
    rand = this.rescale(rand, min, max);

    if(precision != undefined){
      return this.round(rand, precision)
    }

    return rand;

  }

  rescale(value, min, max){
    return (value * (max - min)) + min
  }

  round(value, precision){
    return value.toFixed(precision); 
  }

}

export default RandomGenerator