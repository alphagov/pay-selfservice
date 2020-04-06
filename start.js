const server = require('./server')
const logger = require('./app/utils/logger')(__filename)

logger.info(`[process.version=${process.version}] [NODE_VERSION=${process.env.NODE_VERSION}]`)
server.start()
