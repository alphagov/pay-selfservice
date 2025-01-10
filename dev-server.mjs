import { context } from 'esbuild'
import { spawn } from 'child_process'
import { clientBuild, serverBuild } from './esbuild.config.mjs'
import { rm } from 'node:fs'

let server

const startServer = () => {
  if (server) server.kill()
  server = spawn('node', ['-r', 'dotenv/config', 'dist/application.js'], {
    stdio: 'inherit'
  })
}

async function startDevServer() {
  const clientCtx = await context(clientBuild)

  const serverCtx = await context({
    ...serverBuild,
    plugins: [
      ...serverBuild.plugins,
      {
        name: 'server-rebuild',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length === 0) {
              startServer()
            }
          })
        }
      }
    ]
  })

  await Promise.all([
    clientCtx.watch(),
    serverCtx.watch(),
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

await rm('dist', { recursive: true, force: true }, async () => {
  console.log('✅ [dist] cleared')
  console.log('⚡️ dev server going up ⚡️')
  startDevServer().catch(err => {
    console.error('💥 dev server failed to start:', err)
    process.exit(1)
  })
})
