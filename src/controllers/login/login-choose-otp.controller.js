'use strict'

module.exports = async function chooseOtp (req, res, next) {
  delete req.session.authenticatorMethod
  res.render('login/select-otp-login')
}
