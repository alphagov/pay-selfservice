const _ = require('lodash')
const logger = require('./logger')(__filename)
const displayConverter = require('./display-converter')

const ERROR_MESSAGE = 'There is a problem with the payments platform'
const ERROR_VIEW = 'error'

function response (req, res, template, data = {}) {
  const convertedData = displayConverter(req, data, template)
  render(req, res, template, convertedData)
}

function errorResponse (req, res, msg = ERROR_MESSAGE, status = 500) {
  if (typeof msg !== 'string') {
    msg = 'Please try again or contact support team.'
  }
  const data = { message: msg }

  const errorMeta = {
    status,
    error_message: msg
  }

  logger.info('An error has occurred. Rendering error view', errorMeta)
  res.setHeader('Content-Type', 'text/html')

  res.status(status)
  response(req, res, ERROR_VIEW, data)
}

function render (req, res, template, data) {
  if (process.env.NODE_ENV !== 'production' && _.get(req, 'headers.accept') === 'application/json') {
    res.setHeader('Content-Type', 'application/json')

    res.json(data)
  } else {
    res.render(template, data)
  }
}

function healthCheckResponse (accept, res, data) {
  res.setHeader('Content-Type', 'application/json')
  res.json(data)
}

module.exports = {
  response,
  healthCheckResponse,
  renderErrorView: errorResponse
}
