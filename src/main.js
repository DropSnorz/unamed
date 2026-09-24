import '@fontsource/vt323/latin';
import '@fontsource/share-tech-mono/latin';
import '@fontsource/big-shoulders-stencil-display/latin-700';
import './styles/cockpit.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

createApp(App).use(createPinia()).mount('#app');
