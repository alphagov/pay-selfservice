'use strict'

const lodash = require('lodash')
const emailValidator = require('../utils/email-tools.js')
const paths = require('../paths.js')
const { renderErrorView } = require('../utils/response.js')
const userService = require('../services/user.service.js')

module.exports = {

  emailGet: (req, res) => {
    res.render('forgotten-password/index')
  },

  emailPost: (req, res) => {
    const correlationId = req.correlationId
    const username = req.body.username

    const errors = {}
    if (emailValidator(username)) {
      return userService.sendPasswordResetToken(username, correlationId)
        .then(() => {
          res.redirect(paths.user.passwordRequested)
        }).catch((error) => {
          req.flash('genericError', error.message)
          res.redirect('/reset-password/' + req.params.id)
        })
    } else if (!username) {
      errors.username = 'Enter an email address'
    } else {
      errors.username = 'Enter a valid email address'
    }

    res.render('forgotten-password/index', {
      username,
      errors
    })
  },

  passwordRequested: (req, res) => {
    res.render('forgotten-password/password-requested')
  },

  newPasswordGet: (req, res) => {
    const id = req.params.id
    const render = (user) => {
      if (!user) return renderErrorView(req, res)
      res.render('forgotten-password/new-password', { id: id })
    }

    return userService.findByResetToken(id).then(render, () => {
      req.flash('genericError', 'Something went wrong. Please request a new password reset email.')
      res.redirect('/login')
    })
  },

  newPasswordPost: (req, res) => {
    let reqUser
    return userService
      .findByResetToken(req.params.id)
      .then(function (forgottenPassword) {
        return userService.findByExternalId(forgottenPassword.user_external_id, req.correlationId)
      })
      .then(function (user) {
        if (!user) return renderErrorView(req, res)
        reqUser = user
        return userService.updatePassword(req.params.id, req.body.password)
      })
      .then(function () {
        return userService.logOut(reqUser)
          .then(
            () => {
              req.session.destroy()
              req.flash('generic', 'Password has been updated')
              res.redirect('/login')
            }
          ).catch(() => {
            req.session.destroy()
            req.flash('generic', 'Password has been updated')
            res.redirect('/login')
          })
      })
      .catch(function (error) {
        req.flash('genericError', error.message)
        res.redirect('/reset-password/' + req.params.id)
      })
  }
}
