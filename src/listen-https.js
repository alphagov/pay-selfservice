// localhost https
const logger = require('@root/utils/logger')(__filename)
const https = require('https')
const fs = require('fs')
const path = require('path')
const privateKey = fs.readFileSync(path.join(__dirname, '../local-certs/localhost-key.pem'))
const certificate = fs.readFileSync(path.join(__dirname, '../local-certs/localhost.pem'))

const BIND_HOST = (process.env.BIND_HOST || '127.0.0.1')
const PORT = (process.env.PORT || 3000)

function listen (app) {
  const server = https.createServer({ key: privateKey, cert: certificate }, app)
  server.listen(PORT, BIND_HOST)
  logger.debug(`HTTPS ON @ https://localhost:${PORT}`)
}

module.exports.listenHttps = listen
