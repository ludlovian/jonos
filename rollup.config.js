import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'

export default {
  input: 'src/index.mjs',
  external: ['sade', 'sonos', 'kleur/colors', '@lukeed/ms'],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    replace({
      preventAssignment: true,
      values: {
        __VERSION__: process.env.npm_package_version
      }
    })
  ],
  output: [
    {
      file: 'dist/jonos.mjs',
      format: 'esm',
      sourcemap: false,
      banner: '#!/usr/bin/env node'
    }
  ]
}
