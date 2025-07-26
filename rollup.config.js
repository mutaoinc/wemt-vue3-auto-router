import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import dts from 'rollup-plugin-dts'

// 外部依赖配置 - 这些依赖不会被打包进最终产物
const external = [
  'vue',
  'vue-router', 
  'vite',
  'fs',
  'path',
  'url',
  'util',
  'glob'
]

// 主要构建配置
const mainConfig = {
  input: 'src/index.ts',
  external,
  output: [
    {
      file: 'publish/dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'publish/dist/index.mjs', 
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false,
      sourceMap: true
    })
  ]
}

// 类型声明文件配置
const dtsConfig = {
  input: 'src/index.ts',
  external,
  output: {
    file: 'publish/dist/index.d.ts',
    format: 'es'
  },
  plugins: [
    dts()
  ]
}

export default [mainConfig, dtsConfig]