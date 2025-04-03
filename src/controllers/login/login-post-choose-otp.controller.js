'use strict'

const paths = require('@root/paths')

module.exports = async function chooseOtpPost (req, res, next) {
  const authenticatorMethod = req.body['sign-in-method']
  if (!authenticatorMethod) {
    return res.render('login/select-otp-login', {
      errors: {
        'sign-in-method': 'You need to select an option'
      }
    })
  }

  req.session.authenticatorMethod = authenticatorMethod
  res.redirect(paths.user.otpLogIn)
}
