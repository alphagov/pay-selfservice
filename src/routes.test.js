'use strict'

const sinon = require('sinon')

const paths = require('./paths')
const routes = require('./routes')
const userIsAuthorised = require('./middleware/user-is-authorised')

const pathsNotRequiringAuthentication = [
  '/style-guide',
  '/.well-known/security.txt',
  '/security.txt',
  paths.user.logIn,
  paths.user.otpLogIn,
  paths.user.otpSendAgain,
  paths.user.logOut,
  paths.user.noAccess,
  paths.user.forgottenPassword,
  paths.user.passwordRequested,
  paths.user.forgottenPasswordReset,
  paths.invite.validateInvite,
  paths.invite.subscribeService,
  paths.healthcheck.path,
  paths.staticPaths.naxsiError,
  paths.register.email,
  paths.register.checkEmail,
  paths.register.password,
  paths.register.securityCodes,
  paths.register.authenticatorApp,
  paths.register.phoneNumber,
  paths.register.smsCode,
  paths.register.resendCode,
  paths.privacy
]

describe('The Express router', () => {
  it('should include authorisation middleware in stack for all paths not in exceptions', () => {
    const app = {
      use: sinon.spy(),
      get: sinon.spy(),
      post: sinon.spy(),
      all: sinon.spy()
    }

    routes.bind(app)

    const registerRouteCalls = [
      ...app.get.getCalls(),
      ...app.post.getCalls()
    ]

    const pathsMissingAuthorisation = registerRouteCalls
      .filter(call => {
        const path = call.args[0]
        return !pathsNotRequiringAuthentication.includes(path) &&
          !call.args.includes(userIsAuthorised)
      })
      .map(call => call.args[0])

    if (pathsMissingAuthorisation.length) {
      const pathsStr = Array.from(new Set(pathsMissingAuthorisation)).join('\n\t')
      throw new Error(`The authentication middleware is not called for the following paths:\n\t${pathsStr}`)
    }
  })
})
