'use strict'

const lodash = require('lodash')
const paths = require('../paths.js')
const { renderErrorView } = require('../utils/response.js')
const userService = require('../services/user.service.js')
const logger = require('../utils/logger')(__filename)
const {
  validateEmail,
  validatePassword
} = require('../utils/validation/server-side-form-validations')

const emailGet = function emailGet (req, res) {
  res.render('forgotten-password/index')
}

const emailPost = async function emailPost (req, res) {
  const correlationId = req.correlationId
  const username = req.body.username

  const validEmail = validateEmail(username)
  if (!validEmail) {
    res.render('forgotten-password/index', {
      username,
      errors: {
        username: validEmail.message
      }
    })
  }

  try {
    await userService.sendPasswordResetToken(username, correlationId)
    res.redirect(paths.user.passwordRequested)
  } catch (err) {
    logger.error('Sending password reset email failed: ' + err)
    req.flash('genericError', 'Something went wrong. Please try again.')
    res.redirect('/reset-password/' + req.params.id)
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

const newPasswordPost = async function newPasswordPost (req, res, next) {
  try {
    const token = req.params.id
    const password = req.body.password

    const forgottenPassword = await userService.findByResetToken(token)
    const user = await userService.findByExternalId(forgottenPassword.user_external_id, req.correlationId)

    const validPassword = validatePassword(password)
    if (!validPassword) {
      lodash.set(req, 'session.pageData.updatePasswordRecovered', {
        errors: {
          password: validPassword.message
        }
      })
    }

    await userService.updatePassword(token, password)
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
