
const webpack = require('webpack')

module.exports = function (config) {
  const navegador = process.env.NAVEGADOR || 'ChromeHeadless'

  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: ['src/pruebas/indice.js'],
    preprocessors: { 'src/pruebas/indice.js': ['webpack'] },

    webpack: {
      mode: 'development',
      devtool: false,
      resolve: { extensions: ['.js', '.jsx'] },
      module: {
        rules: [{
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { chrome: '120' } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              plugins: [['istanbul', { exclude: ['src/pruebas/**', 'src/main.jsx'] }]],
            },
          },
        }],
      },
      plugins: [
        new webpack.DefinePlugin({ 'import.meta.env.BASE_URL': JSON.stringify('/') }),
      ],
    },

    reporters: ['spec', 'coverage'],
    specReporter: { suppressPassed: false, suppressSkipped: true },
    coverageReporter: {
      dir: 'cobertura',
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'text' }, { type: 'lcovonly' }],
      check: { global: { statements: 70, branches: 60, functions: 70, lines: 70 } },
    },

    browsers: [navegador],
    customLaunchers: {
      ChromeHeadlessSinSandbox: { base: 'ChromeHeadless', flags: ['--no-sandbox'] },
    },
    plugins: [
      'karma-jasmine', 'karma-webpack', 'karma-chrome-launcher',
      'karma-jsdom-launcher', 'karma-coverage', 'karma-spec-reporter',
    ],
    client: { jasmine: { random: false } },
    singleRun: true,
    restartOnFileChange: false,
  })
}
