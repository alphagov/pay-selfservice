var paths = require('../paths.js')
var errorView = require('../utils/response.js').renderErrorView
var userService = require('../services/user_service.js')
var e = module.exports
var emailTools = require('../utils/email_tools')()

e.emailGet = (req, res) => {
  res.render('forgotten_password/username_get')
}

e.emailPost = (req, res) => {
  let correlationId = req.correlationId
  let username = req.body.username

  if (emailTools.validateEmail(username)) {
    return userService.sendPasswordResetToken(username, correlationId)
      .finally(() => {
        res.redirect(paths.user.passwordRequested)
      })
  } else if (!username) {
    req.flash('error', 'You must enter an email address')
    res.redirect(paths.user.forgottenPassword)
  } else {
    req.flash('error', 'You must enter a valid email address')
    res.redirect(paths.user.forgottenPassword)
  }
}

e.passwordRequested = (req, res) => {
  res.render('forgotten_password/password_requested')
}

e.newPasswordGet = (req, res) => {
  var id = req.params.id
  var render = (user) => {
    if (!user) return errorView(req, res)
    res.render('forgotten_password/new_password', {id: id})
  }

  return userService.findByResetToken(id).then(render, () => {
    req.flash('genericError', 'Invalid password reset link')
    res.redirect('/login')
  })
}

e.newPasswordPost = (req, res) => {
  let reqUser
  return userService
    .findByResetToken(req.params.id)
    .then(function (forgottenPassword) {
      return userService.findByExternalId(forgottenPassword.user_external_id, req.correlationId)
    })
    .then(function (user) {
      if (!user) return errorView(req, res)
      reqUser = user
      return userService.updatePassword(req.params.id, req.body.password)
    })
    .then(function () {
      return userService.logOut(reqUser)
        .finally(
          () => {
            req.session.destroy()
            req.flash('generic', 'Password has been updated')
            res.redirect('/login')
          }
        )
    })
    .catch(function (error) {
      req.flash('genericError', error.message)
      res.redirect('/reset-password/' + req.params.id)
    })
}
