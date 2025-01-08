import { build, context } from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import { copyFileSync, mkdirSync, statSync } from 'fs'
import { glob } from 'glob'

const PUBLIC_DIR = 'public'

async function copyAssets () {
  mkdirSync(`${PUBLIC_DIR}/fonts`, { recursive: true })
  mkdirSync(`${PUBLIC_DIR}/images`, { recursive: true })

  const fontFiles = glob.sync('node_modules/govuk-frontend/dist/govuk/assets/fonts/*')
  fontFiles.forEach(file => {
    if (statSync(file).isFile()) {
      const fileName = file.split('/').pop()
      copyFileSync(file, `${PUBLIC_DIR}/fonts/${fileName}`)
    }
  })

  const imageDirectories = [
    'node_modules/govuk-frontend/dist/govuk/assets/images/**/*',
    'app/assets/images/**/*'
  ]

  imageDirectories.forEach(pattern => {
    const imageFiles = glob.sync(pattern)
    imageFiles.forEach(file => {
      if (statSync(file).isFile()) {
        const fileName = file.split('/').pop()
        copyFileSync(file, `${PUBLIC_DIR}/images/${fileName}`)
      }
    })
  })
}

async function doBuild(isWatch = false) {
  await copyAssets()
  const buildOptions = {
    logLevel: 'info',
    entryPoints: [
      { out: 'application', in: 'app/client-side.js'},
      { out: 'application', in: 'app/assets/sass/application.scss'},
    ],
    outdir: PUBLIC_DIR,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    minify: true,
    sourcemap: true,
    target: ['es2015'],
    assetNames: 'assets/[name]-[hash]',
    plugins: [
      sassPlugin({
        loadPaths: [
          'node_modules'
        ],
        quietDeps: true, // govuk-frontend generates a lot of noise
        silenceDeprecations: ['import'] // silences deprecation warnings r.e. use of @import over @use
      })
    ],
    loader: {
      '.woff': 'file',
      '.woff2': 'file',
      '.svg': 'file',
      '.png': 'file'
    }
  }

  if (isWatch) {
    const ctx = await context(buildOptions)
    await ctx.watch()
  } else {
    await build(buildOptions)
  }
}

doBuild(true).catch(() => process.exit(1))
