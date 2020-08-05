'use strict'

const logger = require('../../app/utils/logger')(__filename)
logger.transports.forEach(t => (t.silent = true))
