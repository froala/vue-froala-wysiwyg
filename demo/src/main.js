import Vue from 'vue'
import App from './App.vue'

// supports both of Vue 1.0 and Vue 2.0
require('froala-editor/js/froala_editor.pkgd.min');

require("froala-editor/css/froala_editor.min.css");
require('font-awesome/css/font-awesome.css');

import VueFroala from 'vue-froala/vue-froala.es5';

Vue.use(VueFroala);
console.log(App)
new Vue({
  el: '#app',
  render: h => h(App)
})
