import process from 'node:process'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'
import terser from '@rollup/plugin-terser'
import run from '@rollup/plugin-run'
import babel from '@rollup/plugin-babel'

const dev = process.env.NODE_ENV != 'production'
const watch = process.env.ROLLUP_WATCH === 'true'

export default [
  {
    input: 'src/index.mjs',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: dev
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      !dev && terser(),
      watch && run()
    ]
  },
  {
    input: 'src/client/main.mjs',
    output: {
      file: 'dist/public/assets/main.mjs',
      format: 'es',
      sourcemap: dev
    },
    plugins: [
      nodeResolve(),
      babel({ babelHelpers: 'bundled' }),
      !dev && terser(),
      copy({
        targets: [
          { src: 'src/client/index.html', dest: 'dist/public/' },
          { src: 'src/client/assets/*', dest: 'dist/public/assets/' }
        ]
      }),
      gzip({
        additionalFiles: [
          'dist/public/assets/bootstrap.min.css',
          'dist/public/assets/bootstrap.bundle.min.js',
          'dist/public/assets/font/bootstrap-icons.min.css'
        ]
      })
    ]
  }
]
