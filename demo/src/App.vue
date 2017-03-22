<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>Vue Froala Demo</h1>
    <froala v-model="model" :config="froalaOptions"></froala>
  </div>
</template>

<script>
import VueFroala from 'vue-froala/vue-froala.es5';
export default {
  name: 'app',
  data () {
    return {
      model: 'text text text',
      froalaOptions: {
        toolbar : ["bold", "italic", "underline", "|", "align", "formatOL", "formatUL"],
        toolbarMD : ["bold", "italic", "underline", "|", "align", "formatOL", "formatUL"]
      }
    }
  },
  created() {

  }

}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
