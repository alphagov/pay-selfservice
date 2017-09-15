'use strict'

// NPM dependencies
const logger = require('winston')
const _ = require('lodash')
const passport = require('passport')

// Custom dependencies
const response = require('../utils/response').response
const userService = require('../services/user_service')
const {setSessionVersion} = require('../services/auth_service')
const router = require('../routes')
const paths = require('../paths')
const errorView = require('../utils/response').renderErrorView
const CORRELATION_HEADER = require('../utils/correlation_header').CORRELATION_HEADER

const processError = function (req, res, err) {
  errorView(req, res)
  logger.error(err)
}

const logLoginAction = function (req, message) {
  const correlationId = _.get(req, 'headers.' + CORRELATION_HEADER, '')
  logger.info(`[${correlationId}] ${message}`)
}

module.exports.loggedIn = function (req, res) {
  logLoginAction(req, 'successfully logged in')
  response(req, res, 'dashboard/index', {
    name: req.user.username,
    serviceId: req.service.externalId
  })
}

module.exports.logOut = function (req, res) {
  if (req.user) {
    userService.logOut(req.user, req.correlationId)
  }

  if (req.session) {
    logLoginAction(req, 'logged out')
    req.session.destroy()
  }

  res.redirect(router.paths.user.logIn)
}

module.exports.noAccess = function (req, res) {
  res.render('login/noaccess')
}

module.exports.logInGet = function (req, res) {
  const setError = function (errorMessages) {
    res.locals.flash.error = {'messages': errorMessages}
  }
  if (res.locals.flash.hasOwnProperty('error')) {
    switch (res.locals.flash.error[0]) {
      case 'invalid':
        setError({username: 'You must enter a valid email address', password: 'You must enter a valid password'})
        break
      case 'empty_all':
        setError({username: 'You must enter an email address', password: 'You must enter a password'})
        break
      case 'empty_username':
        setError({username: 'You must enter an email address'})
        break
      case 'empty_password':
        setError({password: 'You must enter a password'})
        break
    }
  }
  res.render('login/login')
}

/**
 * Reset the login counter for the user, and clean
 * session
 *
 * @param req
 * @param res
 */
module.exports.postLogin = function (req, res) {
  req.session = _.pick(req.session, ['passport', 'last_url', 'currentGatewayAccountId'])
  logLoginAction(req, 'successfully attempted username/password combination')
  res.redirect(paths.user.otpLogIn)
}

module.exports.logUserin = function (req, res, next) {
  let error = ''

  // username gets trimmed in middleware
  if (!req.body.username) {
    error = 'empty_username'
  }

  if (!req.body.password.trim()) {
    error = (error === 'empty_username') ? 'empty_all' : 'empty_password'
  }

  if (error !== '') {
    req.flash('error', error)
    res.redirect('/login')
  } else {
    return passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'invalid'
    })(req, res, next)
  }
}

module.exports.logUserinOTP = function (req, res, next) {
  return passport.authenticate('local2Fa', {
    failureRedirect: '/otp-login',
    badRequestMessage: 'Invalid verification code.',
    failureFlash: true
  })(req, res, next)
}

module.exports.otpLogIn = function (req, res) {
  if (!req.session.sentCode) {
    const correlationId = req.headers[CORRELATION_HEADER] || ''
    userService.sendOTP(req.user, correlationId).then(function () {
      req.session.sentCode = true
      res.render('login/otp-login')
    }, function (err) {
      processError(req, res, err)
    }
    )
  } else {
    res.render('login/otp-login')
  }
}

module.exports.afterOTPLogin = function (req, res) {
  req.session.secondFactor = 'totp'
  const redirectUrl = req.session.last_url || '/'
  delete req.session.last_url
  logLoginAction(req, 'successfully entered a valid 2fa token')
  setSessionVersion(req)
  res.redirect(redirectUrl)
}

module.exports.sendAgainGet = function (req, res) {
  res.render('login/send_otp_again')
}

module.exports.sendAgainPost = function (req, res) {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  userService.sendOTP(req.user, correlationId).then(
    () => {
      res.redirect(paths.user.otpLogIn)
    },
    (err) => {
      processError(req, res, err)
    }
  )
}

module.exports.setupDirectLoginAfterRegister = function (req, res, userExternalId) {
  if (!userExternalId) {
    const correlationId = req.correlationId
    logger.error(`[requestId=${correlationId}] unable to log user in directly after registration. missing user external id in req`)
    res.redirect(303, '/login')
    return
  }

  req.register_invite.userExternalId = userExternalId
}

module.exports.loginAfterRegister = function (req, res, next) {
  return passport.authenticate('localDirect', {failureRedirect: '/login'})(req, res, next)
}
