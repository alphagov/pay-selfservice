import { context } from 'esbuild'
import { spawn } from 'child_process'
import { clientBuild, serverBuild } from './esbuild.config.mjs'
import { rm, access, constants } from 'node:fs'

const args = ['--enable-source-maps', '--inspect', 'dist/application.js']
let server

const startServer = async () => {
  if (server) server.kill()
  console.log(`💻\x1b[32m node\x1b[0m\x1b[33m ${args.join(' ')}\x1b[0m`)
  server = spawn('node', args, {
    stdio: 'inherit'
  })
}

async function startDevServer () {
  const clientCtx = await context(clientBuild)

  const serverCtx = await context({
    ...serverBuild,
    plugins: [
      ...serverBuild.plugins,
      {
        name: 'server-rebuild',
        setup (build) {
          build.onEnd(async result => {
            if (result.errors.length === 0) {
              await startServer()
            }
          })
        }
      }
    ]
  })

  await Promise.all([
    clientCtx.watch(),
    serverCtx.watch()
  ])

  const cleanup = async () => {
    server?.kill()
    await Promise.all([
      clientCtx.dispose(),
      serverCtx.dispose()
    ]).then(() => {
      console.log('\n✅ dev server down')
    })
    process.exit()
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

rm('dist', { recursive: true, force: true }, async () => {
  console.log('✅ [dist] cleared')
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 [cypress/test.env] loaded environment')
    args.unshift('-r', 'dotenv/config')
    args.push('dotenv_config_path=test/cypress/test.env')
  } else {
    access('/.dockerenv', constants.R_OK, (err) => {
      if (err) {
        console.log('🔩 [.env] loaded environment')
        args.unshift('-r', 'dotenv/config')
      } else {
        console.log('🐳 docker environment')
      }
    })
  }
  startDevServer().then(() => {
    console.log('⚡️ dev server going up')
  }).catch(err => {
    console.error('💥 dev server failed to start', err)
    process.exit(1)
  })
})
