'use strict'

const { constants } = require('@govuk-pay/pay-js-commons')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatFutureStrategyAccountPathsFor = require('../../utils/format-future-strategy-account-paths-for')

const webhooksService = require('./webhooks.service')

async function listWebhooksPage(req, res, next) {
  try {
    const webhooks = await webhooksService.listWebhooks(req.service.externalId, req.isLive)
    response(req, res, 'webhooks/list', { webhooks })
  } catch (error) {
    next(error)
  }
}

async function createWebhookPage(req, res, next) {
  response(req, res, 'webhooks/edit', { eventTypes: constants.webhooks.humanReadableSubscriptions })
}

async function createWebhook(req, res, next) {
  try {
    await webhooksService.createWebhook(req.service.externalId, req.isLive, req.body)
    res.redirect(formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.index, req.account.type, req.service.externalId, req.account.external_id))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listWebhooksPage,
  createWebhookPage,
  createWebhook
}
