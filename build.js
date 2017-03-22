var fs = require('fs')
var path = require('path')
var rollup = require('rollup')
var babel = require('rollup-plugin-babel')
var version = process.env.VERSION || require('./package.json').version

var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');
var postcss = require('rollup-plugin-postcss');

var banner =
  '/*!\n' +
  ' * Vue-Froala.js v' + version + '\n' +
  ' * (c) ' + new Date().getFullYear() + ' David Baldwynn <polydaic@gmail.com>\n' +
  ' * Released under the MIT License.\n' +
  ' */'

rollup.rollup({
    entry: path.resolve(__dirname, 'vue-froala.js'),
    plugins: [
        postcss(),
        nodeResolve({main: true, extensions: [ '.js', '.json' ]}),
        babel()
    ]
})
.then(bundle => {
    return write(path.resolve(__dirname, 'vue-froala.es5.js'), bundle.generate({
        format: 'umd',
        banner: banner,
        moduleName: 'install'
    }).code)
})
.then(() => {
    console.log('Vue-Froala.js v' + version + ' built')
})
.catch(console.log);

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function write (dest, code) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(blue(dest) + ' ' + getSize(code))
      resolve()
    })
  })
}
