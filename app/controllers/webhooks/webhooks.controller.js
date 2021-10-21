'use strict'

const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response.js')

const webhooksService = require('./webhooks.service')

async function listWebhooksPage(req, res, next) {
  try {
    const webhooks = await webhooksService.listWebhooks(req.service.externalId, req.isLive)
    response(req, res, 'webhooks/list', { webhooks })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listWebhooksPage
}