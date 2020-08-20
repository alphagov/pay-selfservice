'use strict'

// Local dependencies
const emailValidator = require('../utils/email-tools.js')
const paths = require('../paths.js')
const { renderErrorView } = require('../utils/response.js')
const userService = require('../services/user.service.js')
const logger = require('../utils/logger')(__filename)

const emailGet = function emailGet (req, res) {
  res.render('forgotten-password/index')
}

const emailPost = async function emailPost (req, res) {
  const correlationId = req.correlationId
  const username = req.body.username

  if (emailValidator(username)) {
    try {
      await userService.sendPasswordResetToken(username, correlationId)
      res.redirect(paths.user.passwordRequested)
    } catch (err) {
      logger.error('Sending password reset email failed: ' + err)
      req.flash('genericError', 'Something went wrong. Please try again.')
      res.redirect('/reset-password/' + req.params.id)
    }
  } else if (!username) {
    req.flash('error', 'Enter an email address')
    res.redirect(paths.user.forgottenPassword)
  } else {
    req.flash('error', 'Enter a valid email address')
    res.redirect(paths.user.forgottenPassword)
  }
}

const passwordRequested = function passwordRequested (req, res) {
  res.render('forgotten-password/password-requested')
}

const newPasswordGet = function newPasswordGet (req, res) {
  const id = req.params.id
  const render = (user) => {
    if (!user) return renderErrorView(req, res)
    res.render('forgotten-password/new-password', { id: id })
  }

  return userService.findByResetToken(id).then(render, () => {
      req.flash('genericError', 'Something went wrong. Please request a new password reset email.')
    res.redirect('/login')
  })
}

const newPasswordPost = async function newPasswordPost (req, res) {
  try {
    const forgottenPassword = await userService.findByResetToken(req.params.id)
    const user = await userService.findByExternalId(forgottenPassword.user_external_id, req.correlationId)

    if (!user) {
      return renderErrorView(req, res)
    }

    try {
      await userService.updatePassword(req.params.id, req.body.password)
    } catch (err) {
      req.flash('genericError', err.message)
      return res.redirect('/reset-password/' + req.params.id)
    }
    try {
      await userService.logOut(user)
    } catch (err) {
      // treat as success even if updating session version fails
    }
    req.session.destroy()
    req.flash('generic', 'Password has been updated')
    res.redirect('/login')
  } catch (error) {
    req.flash('genericError', 'Something went wrong. Please try again.')
    res.redirect('/reset-password/' + req.params.id)
  }
}

module.exports = {
  emailGet,
  emailPost,
  passwordRequested,
  newPasswordGet,
  newPasswordPost
}
