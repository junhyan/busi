const path = require('path')
const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')
const node = require('rollup-plugin-node-resolve')
const flow = require('rollup-plugin-flow-no-whitespace')
const version = process.env.VERSION || require('../package.json').version

const banner =
  '/*!\n' +
  ' * Busi\n' +
  ' */'


const builds = {
  
  // Runtime+compiler CommonJS build (ES Modules)
  'web-full-esm': {
    entry: path.resolve('busi.js'),
    dest: path.resolve('dist/busi.esm.js'),
    format: 'es',
    alias: { he: './entity-decoder' },
    banner
  },
  'web-full-dev': {
    entry: path.resolve('busi.js'),
    dest: path.resolve('dist/busi.js'),
    format: 'umd',
    alias: { he: './entity-decoder' },
    banner
  },
}

function genConfig (name) {
  const opts = builds[name]
  const config = {
    input: opts.entry,
    external: opts.external,
    plugins: [
      replace({
        __VERSION__: version
      }),
      flow(),
      buble(),
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || 'Busi'
    }
  }

  if (opts.env) {
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  Object.defineProperty(config, '_name', {
    enumerable: false,
    value: name
  })

  return config
}

if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET)
} else {
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
