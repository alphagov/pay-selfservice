'use strict'

const { constants } = require('@govuk-pay/pay-js-commons')

const { response } = require('../../utils/response.js')
const paths = require('../../paths')
const formatFutureStrategyAccountPathsFor = require('../../utils/format-future-strategy-account-paths-for')

const webhooksService = require('./webhooks.service')
const logger = require('../../utils/logger.js')(__filename)

async function webhookDetailPage (req, res, next) {
  const status = req.query.status
  const page = req.query.page || 1

  try {
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)
    const messages = await webhooksService.getWebhookMessages(req.params.webhookId, { page, ...status && status })

    response(req, res, 'webhooks/detail', {
      eventTypes: constants.webhooks.humanReadableSubscriptions,
      webhook,
      messages,
      status,
      page
    })
  } catch (error) {
    next(error)
  }
}

async function listWebhooksPage (req, res, next) {
  try {
    const webhooks = await webhooksService.listWebhooks(req.service.externalId, req.isLive)
    response(req, res, 'webhooks/list', { webhooks })
  } catch (error) {
    next(error)
  }
}

async function createWebhookPage (req, res, next) {
  response(req, res, 'webhooks/edit', { eventTypes: constants.webhooks.humanReadableSubscriptions })
}

async function updateWebhookPage (req, res, next) {
  try {
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)
    response(req, res, 'webhooks/edit', { eventTypes: constants.webhooks.humanReadableSubscriptions, isEditing: true, webhook })
  } catch (error) {
    next(error)
  }
}

async function signingSecretPage (req, res, next) {
  try {
    let signingSecret
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)

    try {
      signingSecret = await webhooksService.getSigningSecret(req.params.webhookId, req.service.externalId)
    } catch (error) {
      logger.warn('Unable to fetch signing secret for Webhook')
    }
    response(req, res, 'webhooks/signing_secret', { webhook, signingSecret })
  } catch (error) {
    next(error)
  }
}

async function toggleActivePage (req, res, next) {
  try {
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)
    response(req, res, 'webhooks/toggle_active', { webhook })
  } catch (error) {
    next(error)
  }
}

async function webhookMessageDetailPage (req, res, next) {
  try {
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)
    const message = await webhooksService.getWebhookMessage(req.params.messageId, req.params.webhookId)
    const attempts = await webhooksService.getWebhookMessageAttempts(req.params.messageId, req.params.webhookId)
    response(req, res, 'webhooks/message', { webhook, message, attempts, eventTypes: constants.webhooks.humanReadableSubscriptions })
  } catch (error) {
    next(error)
  }
}

async function createWebhook (req, res, next) {
  try {
    await webhooksService.createWebhook(req.service.externalId, req.isLive, req.body)
    res.redirect(formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.index, req.account.type, req.service.externalId, req.account.external_id))
  } catch (error) {
    next(error)
  }
}

async function updateWebhook (req, res, next) {
  try {
    await webhooksService.updateWebhook(req.params.webhookId, req.service.externalId, req.body)
    res.redirect(formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.detail, req.account.type, req.service.externalId, req.account.external_id, req.params.webhookId))
  } catch (error) {
    next(error)
  }
}

async function toggleActiveWebhook(req, res, next) {
  try {
    const webhook = await webhooksService.getWebhook(req.params.webhookId, req.service.externalId)

    await webhooksService.toggleStatus(req.params.webhookId, req.service.externalId, webhook.status)

    req.flash('generic', 'Webhook status updated')
    res.redirect(formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.detail, req.account.type, req.service.externalId, req.account.external_id, req.params.webhookId))
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listWebhooksPage,
  createWebhookPage,
  createWebhook,
  updateWebhook,
  toggleActiveWebhook,
  updateWebhookPage,
  webhookDetailPage,
  signingSecretPage,
  toggleActivePage,
  webhookMessageDetailPage
}
