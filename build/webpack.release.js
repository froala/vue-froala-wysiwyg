var path = require('path')
var webpack = require("webpack")
var ExtractTextPlugin = require("extract-text-webpack-plugin")
var projectRoot = path.resolve(__dirname, '../')
var cssLoader = ExtractTextPlugin.extract('style-loader', 'css-loader')

module.exports = {
  entry: {
    'vue-froala': './src/vue-froala.js',
  },
  output: {
    filename: '[name].js',
    library: 'vue-froala-wysiwyg',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  performance: {
    maxEntrypointSize: 700000,
	maxAssetSize: 700000
  },
 
  mode: 'production',
  module: {
    rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
        enforce: 'pre'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/env'],
          plugins: ['@babel/plugin-transform-runtime']
        },
        include: projectRoot,
        exclude: /node_modules/,
        enforce: 'pre'
      },
      {
        test: /\.css$/,
        loader: cssLoader
      },
      {
        test: /\.s[a|c]ss$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader!sass-loader')
      }
    ]
  },
  optimization: {
    minimize: false,
  }
}
