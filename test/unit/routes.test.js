'use strict'

const sinon = require('sinon')

const paths = require('../../app/paths')
const routes = require('../../app/routes')
const userIsAuthorised = require('../../app/middleware/user-is-authorised')

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
  paths.inviteValidation.validateInvite,
  paths.registerUser.registration,
  paths.registerUser.subscribeService,
  paths.registerUser.otpVerify,
  paths.registerUser.reVerifyPhone,
  paths.registerUser.logUserIn,
  paths.selfCreateService.register,
  paths.selfCreateService.confirm,
  paths.selfCreateService.otpVerify,
  paths.selfCreateService.otpResend,
  paths.healthcheck.path,
  paths.staticPaths.naxsiError
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
