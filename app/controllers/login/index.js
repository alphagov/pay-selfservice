'use strict'

exports.logout = require('./logout-controller')
exports.noAccess = require('./no-access-controller')
exports.loginGet = require('./login-get-controller')
exports.postLogin = require('./post-login-controller')
exports.loginUser = require('./login-user-controller')
exports.loginUserOTP = require('./login-user-otp-controller')
exports.otpLogin = require('./otp-login-controller')
exports.afterOTPLogin = require('./after-otp-login-controller')
exports.sendAgainGet = require('./send-again-get-controller')
exports.sendAgainPost = require('./send-again-post-controller')
exports.setupDirectLoginAfterRegister = require('./setup-direct-login-after-register-controller')
exports.loginAfterRegister = require('./login-after-register-controller')
