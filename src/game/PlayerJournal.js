class PlayerJournal {

  constructor() {
    this.locations = {}
  }

  visit(location) {
    this.initLocationEntry(location);
    this.locations[location]['visited'] = true;
  }

  isVisited(location) {
    return location in this.locations && this.locations[location]['visited']
  }

  initLocationEntry(location) {
    if (!(location in this.locations)) {
      this.locations[location] = {}
    }
  }
}

let playerJournal = new PlayerJournal()
export default playerJournal;
