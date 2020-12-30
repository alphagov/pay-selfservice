'use strict'

const paths = require('../paths.js')
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
  if (!validEmail.valid) {
    return res.render('forgotten-password/index', {
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
    if (err.errorCode === 404) {
      // Tell the user an email has been sent if the account doesn't exist
      // This is to prevent username enumeration
      res.redirect(paths.user.passwordRequested)
    } else {
      logger.error('Sending password reset email failed: ' + err)
      req.flash('genericError', 'Something went wrong. Please try again.')
      res.redirect('/reset-password')
    }
  }
}

const passwordRequested = function passwordRequested (req, res) {
  res.render('forgotten-password/password-requested')
}

const newPasswordGet = async function newPasswordGet (req, res) {
  const { id } = req.params
  try {
    await userService.findByResetToken(id, req.correlationId)
    res.render('forgotten-password/new-password', { id: id })
  } catch (err) {
    req.flash('genericError', 'The password reset request has expired or is invalid. Please try again.')
    res.redirect('/login')
  }
}

const newPasswordPost = async function newPasswordPost (req, res) {
  try {
    const { id } = req.params
    const password = req.body.password

    const forgottenPassword = await userService.findByResetToken(id, req.correlationId)
    const user = await userService.findByExternalId(forgottenPassword.user_external_id, req.correlationId)

    const validPassword = validatePassword(password)
    if (!validPassword.valid) {
      return res.render('forgotten-password/new-password', {
        id: id,
        errors: {
          password: validPassword.message
        }
      })
    }

    await userService.updatePassword(id, password, req.correlationId)
    try {
      await userService.logOut(user, req.correlationId)
    } catch (err) {
      // treat as success even if updating session version fails
    }
    req.session.destroy()
    req.flash('generic', 'Password has been updated')
    res.redirect('/login')
  } catch (error) {
    req.flash('genericError', 'There has been a problem updating password. Please try again.')
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
