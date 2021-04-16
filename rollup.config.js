import cleanup from 'rollup-plugin-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.js',
  external: [
    'sade',
    'sonos',
    'url',
    'debug',
    'promise-goodies',
    'ms'
  ],
  plugins: [json(), commonjs(), cleanup()],
  output: [
    {
      file: 'dist/jonos',
      format: 'cjs',
      sourcemap: false,
      banner: '#!/usr/bin/env node'
    }
  ]
}
