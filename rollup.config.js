import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import gzip from 'rollup-plugin-gzip'

export default [
  {
    input: "src/index.mjs",
    output: {
      file: "dist/index.mjs",
      format: "es"
    },
    plugins: [
      commonjs(),
      nodeResolve()
    ]
  },
  {
    input: "src/client/main.mjs",
    output: {
      file: "dist/public/main.mjs",
      format: "es"
    },
    plugins: [
      nodeResolve(),
      copy({
        targets: [
          { src: 'src/client/*.html', dest: 'dist/public' },
          { src: 'src/client/bootstrap.min.*', dest: 'dist/public' }
        ],
      }),
      gzip({
        additionalFiles: [
          'dist/public/bootstrap.min.css',
          'dist/public/bootstrap.min.js'
        ]
      })
    ]
  }
]
