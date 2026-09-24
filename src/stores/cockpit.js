import { ref } from 'vue';
import { defineStore } from 'pinia';

/** Cockpit UI state that is not part of the game itself */
export const useCockpitStore = defineStore('cockpit', () => {
  /** Navigation screen mode: system | sector | cluster */
  const navMode = ref('system');
  const audio = ref(true);

  function setNavMode(mode) {
    navMode.value = mode;
  }

  return { navMode, audio, setNavMode };
});
