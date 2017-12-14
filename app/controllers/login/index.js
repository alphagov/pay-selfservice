'use strict'

module.exports.logout = require('./logout-controller')
module.exports.noAccess = require('./no-access-controller')
module.exports.loginGet = require('./login-get-controller')
module.exports.postLogin = require('./post-login-controller')
module.exports.loginUser = require('./login-user-controller')
module.exports.loginUserOTP = require('./login-user-otp-controller')
module.exports.otpLogin = require('./otp-login-controller')
module.exports.afterOTPLogin = require('./after-otp-login-controller')
module.exports.sendAgainGet = require('./send-again-get-controller')
module.exports.sendAgainPost = require('./send-again-post-controller')
module.exports.setupDirectLoginAfterRegister = require('./setup-direct-login-after-register-controller')
module.exports.loginAfterRegister = require('./login-after-register-controller')
