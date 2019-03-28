// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import Vue from 'vue'
import App from './examples/App'

// supports both of Vue 1.0 and Vue 2.0
require('froala-editor/js/froala_editor.min');

require("froala-editor/css/froala_editor.pkgd.min.css");
require('froala-editor/css/froala_style.min.css')

import VueFroala from 'src';

Vue.use(VueFroala);

new Vue({
  render: h => h(App)
}).$mount('#app')
