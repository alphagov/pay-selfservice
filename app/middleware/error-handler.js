'use strict'

const Sentry = require('@sentry/node')
const { AxiosError } = require('axios')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const logger = require('../utils/logger')(__filename)
const {
  NotAuthenticatedError,
  UserAccountDisabledError,
  NotAuthorisedError,
  PermissionDeniedError,
  NoServicesWithPermissionError,
  NotFoundError,
  RegistrationSessionMissingError,
  InvalidRegistationStateError,
  InvalidConfigurationError,
  ExpiredInviteError,
  GatewayTimeoutError,
  GatewayTimeoutForAllServicesSearchError
} = require('../errors')
const paths = require('../paths')
const { renderErrorView, response } = require('../utils/response')

module.exports = function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof NotAuthenticatedError) {
    if (req.session) {
      req.session.last_url = req.originalUrl
    }
    logger.info(`NotAuthenticatedError handled: ${err.message}. Redirecting attempt to access ${req.originalUrl} to ${paths.user.logIn}`)
    return res.redirect(paths.user.logIn)
  }

  if (err instanceof UserAccountDisabledError) {
    logger.info('UserAccountDisabledError handled, rendering no access page')
    res.status(401)
    return res.render('login/noaccess')
  }

  if (err instanceof NotAuthorisedError) {
    logger.info(`NotAuthorisedError handled: ${err.message}. Rendering error page`)
    return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
  }

  if (err instanceof PermissionDeniedError) {
    logger.info(`PermissionDeniedError handled: ${err.message}. Rendering error page`)
    return renderErrorView(req, res, 'You do not have the administrator rights to perform this operation.', 403)
  }

  if (err instanceof NoServicesWithPermissionError) {
    logger.info(`NoServicesWithPermissionError handled: ${err.message}. Rendering error page`)
    return renderErrorView(req, res, err.message, 403)
  }

  if (err instanceof NotFoundError) {
    logger.info(`NotFoundError handled: ${err.message}. Rendering 404 page`)
    res.status(404)
    return response(req, res, '404')
  }

  if (err instanceof RegistrationSessionMissingError || err instanceof InvalidRegistationStateError) {
    logger.info(`RegistrationSessionMissingError handled. Rendering error page`)
    return renderErrorView(req, res, 'There has been a problem proceeding with this registration. Please try again.', 400)
  }

  if (err instanceof InvalidConfigurationError) {
    logger.info(`InvalidConigurationError handled: ${err.message}. Rendering error page`)
    return renderErrorView(req, res, 'This account is not configured to perform this action. Please contact support the support team.', 400)
  }

  if (err instanceof ExpiredInviteError) {
    logger.info(`ExpiredInviteError handled: ${err.message}. Rendering error page`)
    return renderErrorView(req, res, 'This invitation is no longer valid', 410)
  }

  if (err && err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF secret provided is invalid')
    return renderErrorView(req, res, 'There is a problem with the payments platform. Please contact the support team', 400)
  }

  if (err instanceof GatewayTimeoutError) {
    logger.info('Gateway Time out Error occurred on Transactions Search Page. Rendering error page')
    return renderErrorView(req, res, err.message, 504)
  }

  if (err instanceof GatewayTimeoutForAllServicesSearchError) {
    logger.info('Gateway Time out Error occurred on Transactions for All Services Search Page. Rendering error page')
    let allServiceTransactionsNoSearchPath = req.session.allServicesTransactionsStatusFilter
      ? paths.formattedPathFor(paths.allServiceTransactions.indexStatusFilterWithoutSearch, req.session.allServicesTransactionsStatusFilter)
      : paths.formattedPathFor(paths.allServiceTransactions.indexStatusFilterWithoutSearch, 'live')
    const queryString = req.originalUrl.split('?')[1]
    if (queryString) {
      allServiceTransactionsNoSearchPath += '?' + queryString
    }

    return renderErrorView(req, res, err.message, 504, {
      allServicesTimeout: true,
      allServiceTransactionsNoSearchPath: allServiceTransactionsNoSearchPath
    })
  }

  if (err instanceof RESTClientError) {
    logger.info(`Unhandled REST client error caught: ${err.message}`, {
      service: err.service,
      status: err.statusCode
    })
  } else if (err instanceof AxiosError) {
    logger.info(`Unhandled AxiosError caught: ${err.message}`, {
      'status': err.response && err.response.status,
      'response_data': err.response && err.response.data
    })
  } else {
    logger.info(`Unhandled error caught: ${err.message}`, {
      stack: err.stack
    })
  }
  Sentry.captureException(err)
  renderErrorView(req, res, 'There is a problem with the payments platform. Please contact the support team.', 500)
}
