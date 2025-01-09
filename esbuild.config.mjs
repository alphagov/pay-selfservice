import { build, context } from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import { copy } from 'esbuild-plugin-copy'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { rm } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.NODE_ENV !== 'production'

const buildOptions = {
  logLevel: 'info',
  bundle: true,
  outdir: 'dist',
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  outExtension: {
    '.css': '.css',
    '.js': '.js'
  }
}

const clientBuild = {
  ...buildOptions,
  entryPoints: [
    { out: 'assets/stylesheets/application', in: 'app/assets/sass/application.scss' },
    { out: 'assets/js/client', in: 'app/client-side.js' }
  ],
  format: 'iife',
  platform: 'browser',
  plugins: [
    sassPlugin({
      loadPaths: ['node_modules'],
      quietDeps: true,
      silenceDeprecations: ['import'],
      style: isDev ? 'expanded' : 'compressed',
      type: 'css'
    }),
    copy({
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['node_modules/govuk-frontend/dist/govuk/assets/**/*'],
          to: ['dist/govuk-frontend-assets']
        },
        {
          from: ['app/assets/images/**/*'],
          to: ['dist/assets/images']
        },
        {
          from: ['app/assets/csv/**/*'],
          to: ['dist/assets/csv']
        }
      ]
    })
  ],
  external: ['*.svg', '*.png', '*.woff', '*.woff2']
}

const serverBuild = {
  ...buildOptions,
  entryPoints: [
    { out: 'application', in: 'app/start.js' },
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
      resolveFrom: 'cwd',
      assets: [
        {
          from: ['app/views/**/*.njk'],
          to: ['dist/views'],
          watch: isDev
        },
        {
          from: ['node_modules/govuk-frontend/dist/**/*.njk'],
          to: ['dist/views']
        }
      ]
    })
  ]
}

export { clientBuild, serverBuild }

// if file is called directly, do this
if (import.meta.url === `file://${process.argv[1]}`) {
  await rm('dist', { recursive: true, force: true }, async () => {
    console.log('✅ [dist] cleared')
    console.log('🚧 starting build...')
    await Promise.all([
      build(clientBuild),
      build(serverBuild)
    ])
  })
}
