'use strict'

const qrcode = require('qrcode')
const lodash = require('lodash')

const { RegistrationSessionMissingError } = require('../../errors')
const adminusersClient = require('../../services/clients/adminusers.client')()
const paths = require('../../paths')
const { validatePassword } = require('../../utils/validation/server-side-form-validations')
const { isEmpty } = require('../../utils/validation/field-validation-checks')

const PASSWORD_INPUT_FIELD_NAME = 'password'
const REPEAT_PASSWORD_INPUT_FIELD_NAME = 'repeat-password'

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

async function submitPasswordPage (req, res, next) {
  const sessionData = req.register_invite
  if (!registrationSessionPresent(sessionData)) {
    return next(new RegistrationSessionMissingError())
  }

  const password = req.body[PASSWORD_INPUT_FIELD_NAME]
  const repeatPassword = req.body[REPEAT_PASSWORD_INPUT_FIELD_NAME]

  const errors = {}

  const passwordValidationResult = validatePassword(password)
  if (!passwordValidationResult.valid) {
    errors[PASSWORD_INPUT_FIELD_NAME] = passwordValidationResult.message
  }
  if (isEmpty(repeatPassword)) {
    errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Re-type your password'
  } else if (!errors[PASSWORD_INPUT_FIELD_NAME] && password !== repeatPassword) {
    errors[PASSWORD_INPUT_FIELD_NAME] = errors[REPEAT_PASSWORD_INPUT_FIELD_NAME] = 'Enter same password in both fields'
  }

  if (!lodash.isEmpty(errors)) {
    return res.render('registration/password', { errors })
  }

  try {
    await adminusersClient.updateInvitePassword(sessionData.code, password)
    res.redirect(paths.register.securityCodes)
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
  submitPasswordPage,
  showChooseSignInMethodPage,
  showAuthenticatorAppPage,
  showPhoneNumberPage,
  showSmsSecurityCodePage,
  showResendSecurityCodePage,
  showSuccessPage
}
