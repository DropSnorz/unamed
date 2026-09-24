import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    currentSystem: null
  }),
  actions: {
    setCurrentSystem(currentSystem) {
      this.currentSystem = currentSystem
    }
  }
})
