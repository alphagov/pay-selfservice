'use strict'

const logger = require('../../src/utils/logger')(__filename)
logger.transports.forEach(t => (t.silent = true))
