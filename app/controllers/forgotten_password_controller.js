'use strict'

const emailValidator = require('../utils/email_tools.js')
const paths = require('../paths.js')
const { renderErrorView } = require('../utils/response.js')
const userService = require('../services/user_service.js')

module.exports = {

  emailGet: (req, res) => {
    res.render('forgotten_password/index')
  },

  emailPost: (req, res) => {
    const correlationId = req.correlationId
    const username = req.body.username

    if (emailValidator(username)) {
      return userService.sendPasswordResetToken(username, correlationId)
        .then(() => {
          res.redirect(paths.user.passwordRequested)
        }).catch((error) => {
          req.flash('genericError', error.message)
          res.redirect('/reset-password/' + req.params.id)
        })
    } else if (!username) {
      req.flash('error', 'You must enter an email address')
      res.redirect(paths.user.forgottenPassword)
    } else {
      req.flash('error', 'You must enter a valid email address')
      res.redirect(paths.user.forgottenPassword)
    }
  },

  passwordRequested: (req, res) => {
    res.render('forgotten_password/password_requested')
  },

  newPasswordGet: (req, res) => {
    const id = req.params.id
    const render = (user) => {
      if (!user) return renderErrorView(req, res)
      res.render('forgotten_password/new_password', { id: id })
    }

    return userService.findByResetToken(id).then(render, () => {
      req.flash('genericError', 'Invalid password reset link')
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
