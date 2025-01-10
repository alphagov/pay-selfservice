const server = require('./server')
const banner = `                            __                                __ ___                     _
  ___ _ ___  _  __   __ __ / /__  ___  ___ _ __ __  ___ ___  / // _/___ ___  ____ _  __ (_)____ ___
 / _ \`// _ \\| |/ /_ / // //  '_/ / _ \\/ _ \`// // / (_-</ -_)/ // _/(_-</ -_)/ __/| |/ // // __// -_)
 \\_, / \\___/|___/(_)\\_,_//_/\\_\\ / .__/\\_,_/ \\_, / /___/\\__//_//_/ /___/\\__//_/   |___//_/ \\__/ \\__/
/___/                          /_/         /___/
================ Starting Up =================
NODE_ENV: ${process.env.NODE_ENV || 'development'}, ${process.version}
HOST/PORT: ${process.env.BIND_HOST || '127.0.0.1'}:${process.env.PORT || 3000}
TIME: ${new Date().toISOString()}
==============================================`
console.log(banner)
server.start()
