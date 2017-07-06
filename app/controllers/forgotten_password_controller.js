const paths = require('../paths.js')
const errorView = require('../utils/response.js').renderErrorView
const userService = require('../services/user_service.js')
const e = module.exports

e.emailGet = (req, res) => {
  res.render('forgotten_password/username_get')
}

e.emailPost = (req, res) => {
  const correlationId = req.correlationId
  const username = req.body.username
  return userService.sendPasswordResetToken(username, correlationId)
    .finally(() => {
      res.redirect(paths.user.passwordRequested)
    })
}

e.passwordRequested = (req, res) => {
  res.render('forgotten_password/password_requested')
}

e.newPasswordGet = (req, res) => {
  const id = req.params.id
  const render = (user) => {
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
