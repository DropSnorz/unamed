// initial state
const state = {
  initiated: false,
  map: null,
}

// getters
const getters = {

}

// actions
const actions = {
  initiate({ state, commit }, initiated) {
    commit('initiate', initiated)
  },
  setMap({ state, commit }, map) {
    commit('setMap', map)
  }
}

// mutations
const mutations = {
  initiate(state, initiated) {
    state.initiated = initiated
  },
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