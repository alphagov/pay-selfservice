'use strict'

const qrcode = require('qrcode')

const { RegistrationSessionMissingError } = require('../../errors')
const adminusersClient = require('../../services/clients/adminusers.client')()
const paths = require('../../paths')

const registrationSessionPresent = function registrationSessionPresent (sessionData) {
  return sessionData && sessionData.email && sessionData.code
}

async function showPasswordPage (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  try {
    const invite = await adminusersClient.getValidatedInvite(sessionData.code)
    if (invite.password_set) {
      return res.redirect(paths.register.securityCodes)
    }

    res.render('registration/password')
  } catch (err) {
    next(err)
  }
}

function showChooseSignInMethodPage (req, res) {
  res.render('registration/get-security-codes')
}

async function showAuthenticatorAppPage (req, res) {
  const exampleSecretKey = 'ANEXAMPLESECRETSECONDFACTORCODE1' // pragma: allowlist secret
  const prettyPrintedSecret = exampleSecretKey.match(/.{4}/g).join(' ')
  const otpUrl = `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent('username')}?secret=${encodeURIComponent(exampleSecretKey)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`
  const qrCodeDataUrl = await qrcode.toDataURL(otpUrl)

  res.render('registration/authenticator-app', {
    prettyPrintedSecret,
    qrCodeDataUrl
  })
}

function showPhoneNumberPage (req, res) {
  res.render('registration/phone-number')
}

function showSmsSecurityCodePage (req, res) {
  res.render('registration/sms-code', { redactedPhoneNumber: '*******1111' })
}

function showResendSecurityCodePage (req, res) {
  res.render('registration/resend-code')
}

function showSuccessPage (req, res) {
  res.render('registration/success')
}

module.exports = {
  showPasswordPage,
  showChooseSignInMethodPage,
  showAuthenticatorAppPage,
  showPhoneNumberPage,
  showSmsSecurityCodePage,
  showResendSecurityCodePage,
  showSuccessPage
}
