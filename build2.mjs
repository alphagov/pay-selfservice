import { build, context } from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import { copy } from 'esbuild-plugin-copy'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const buildOptions = {
  logLevel: 'info',
  bundle: true,
  outdir: 'dist',
  minify: true,
  sourcemap: true,
  outExtension: {
    '.css': '.css',
    '.js': '.js'
  }
}

const clientBuild = {
  ...buildOptions,
  entryPoints: [
    { out: 'assets/stylesheets/application', in: 'app/assets/sass/application.scss'},
    { out: 'assets/js/client', in: 'app/client-side.js'}
  ],
  format: 'iife',
  platform: 'browser',
  plugins: [
    sassPlugin({
      loadPaths: ['node_modules'],
      quietDeps: true,
      silenceDeprecations: ['import']
    }),
    copy({
      assets: {
        from: ['./app/assets/govuk-frontend-assets/**/*'],
        to: ['./govuk-frontend-assets']
      }
    }),
    copy({
      assets: {
        from: ['./app/assets/images/**/*'],
        to: ['./assets/images']
      }
    })
  ],
  external: ['*.svg', '*.png', '*.woff', '*.woff2']
}

const serverBuild ={
  ...buildOptions,
  entryPoints: [
    { out: 'application', in: 'start.js'},
  ],
  alias: {
    '@root': resolve(__dirname, 'app'),
    '@controllers': resolve(__dirname, 'app/controllers'),
    '@middleware': resolve(__dirname, 'app/middleware'),
    '@models': resolve(__dirname, 'app/models'),
    '@services': resolve(__dirname, 'app/services'),
    '@utils': resolve(__dirname, 'app/utils'),
    '@views': resolve(__dirname, 'app/views'),
    '@test': resolve(__dirname, 'test')
  },
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['*.node'],
  plugins: [
    copy({
      assets: {
        from: ['./app/views/**/*.njk'],
        to: ['./views']
      }
    }),
    copy({
      assets: {
        from: ['./node_modules/govuk-frontend/dist/**/*.njk'],
        to: ['./views']
      }
    })
  ]
}

await Promise.all([
  build(clientBuild),
  build(serverBuild)
])
