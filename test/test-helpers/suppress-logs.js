'use strict'

const logger = require('@utils/logger')(__filename)
logger.transports.forEach(t => (t.silent = true))
