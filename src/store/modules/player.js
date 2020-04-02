// initial state
const state = {
  currentSystem: null,
}

// getters
const getters = {
}

// actions
const actions = {
  setCurrentSystem({ state, commit }, currentSystem) {
    commit('setCurrentSystem', currentSystem)
  }
}

// mutations
const mutations = {
  setCurrentSystem(state, currentSystem) {
    state.currentSystem = currentSystem
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
