import Vue from 'vue'
import Vuex from 'vuex'
import player from './modules/player'
import world from './modules/world'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    player,
    world
  }
})