import { defineStore } from 'pinia'

export const useWorldStore = defineStore('world', {
  state: () => ({
    initiated: false,
    map: null
  }),
  actions: {
    initiate(initiated) {
      this.initiated = initiated
    },
    setMap(map) {
      this.map = map
    }
  }
})
