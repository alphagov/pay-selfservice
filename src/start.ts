import server from './server'

const banner = `
                       __                                 _____                 _
  ___ ____ _  __ __ __/ /__    ___  ___ ___ __   ___ ___ / / _/__ ___ _____  __(_)______
 / _ \`/ _ \\ |/ // // /  '_/   / _ \\/ _ \`/ // /  (_-</ -_) / _(_-</ -_) __/ |/ / / __/ -_)
 \\_, /\\___/___(_)_,_/_/\\_\\   / .__/\\_,_/\\_, /  /___/\\__/_/_//___/\\__/_/  |___/_/\\__/\\__/
/___/                       /_/        /___/

================ START =======================
PLATFORM: ${process.platform}/${process.arch}
NODE_ENV: ${process.env.NODE_ENV ?? 'development'}, ${process.version}
HOST/PORT: ${process.env.BIND_HOST ?? '127.0.0.1'}:${process.env.PORT ?? 3000}
==============================================`
console.log(banner)
server.start()
