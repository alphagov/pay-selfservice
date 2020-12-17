'use strict'

const sinon = require('sinon')

const paths = require('../../app/paths')
const routes = require('../../app/routes')
const oldAuthorisationMiddleware = require('../../app/services/auth.service').enforceUserAuthenticated
const authorisationMiddlewareName = require('../../app/middleware/user-is-authorised')

const pathsNotRequiringAuthentication = [
  '/style-guide',
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

function flattenPaths (arrayThatMayContainObjects) {
  return arrayThatMayContainObjects.reduce((paths, val) => {
    if (typeof val === 'object' && val != null) {
      return paths.concat(flattenPaths(Object.values(val)))
    } else {
      paths.push(val)
      return paths
    }
  }, [])
}

describe('The Express router', () => {
  it('should include authorisation middleware in stack for all paths not in exceptions', () => {
    const app = {
      use: sinon.spy(),
      get: sinon.spy(),
      post: sinon.spy(),
      all: sinon.spy()
    }

    routes.bind(app)

    // We currently call `app.use` to specify a list of paths to use certain middleware for,
    // including the authorisation middleware. We need to check that paths are either included in
    // the array for this call, or the middleware is added to the stack individually for the route
    const authenticatedPathsArg = app.use.getCalls()
      .find(call => {
        return Array.isArray(call.args[0]) &&
          (call.args.includes(oldAuthorisationMiddleware) || call.args.includes(authorisationMiddlewareName))
      })
      .args[0]
    const authenticatedPaths = flattenPaths(authenticatedPathsArg)

    const registerRouteCalls = [
      ...app.get.getCalls(),
      ...app.post.getCalls()
    ]

    const pathsMissingAuthorisation = registerRouteCalls
      .filter(call => {
        const path = call.args[0]
        return !pathsNotRequiringAuthentication.includes(path) &&
          !authenticatedPaths.includes(path) &&
          !(call.args.includes(oldAuthorisationMiddleware) || call.args.includes(authorisationMiddlewareName))
      })
      .map(call => call.args[0])
    if (pathsMissingAuthorisation.length) {
      const pathsStr = Array.from(new Set(pathsMissingAuthorisation)).join('\n\t')
      throw new Error(`The authentication middleware is not called for the following paths:\n\t${pathsStr}`)
    }
  })
})
