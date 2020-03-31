// initial state
const state = {
  map: null,
}

// getters
const getters = {
}

// actions
const actions = {
  setMap({ state, commit }, map) {
    commit('setMap', map)
  }
}

// mutations
const mutations = {
  setMap(state, map) {
    state.map = map
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}