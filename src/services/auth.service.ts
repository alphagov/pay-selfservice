import type { Request, Response, NextFunction, Application } from 'express'
import type { VerifyFunction } from 'passport-local'
import type ClientSessionsCookie from '@utils/types/client-sessions/ClientSessionsCookie'
import type User from '@models/user/User.class'
import secondFactorMethod from '@models/constants/second-factor-method'
import lodash from 'lodash'
import passport, { AuthenticateCallback } from 'passport'
import * as passportLocal from 'passport-local'
import passportCustom from 'passport-custom'
import createLogger from '@utils/logger'
import sessionValidator from '@services/session-validator.js'
import paths from '@root/paths.js'
import userService from '@services/user.service.js'
import { addField } from '@services/clients/base/request-context'
// @ts-expect-error js commons is not updated for typescript support yet
import { logging } from '@govuk-pay/pay-js-commons'
import { validationErrors } from '@utils/validation/field-validation-checks'
import { validateOtp } from '@utils/validation/server-side-form-validations'
import { sanitiseSecurityCode } from '@utils/security-code-utils'
// @ts-expect-error js commons is not updated for typescript support yet
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'

const logger = createLogger(__filename)
const CustomStrategy = passportCustom.Strategy
// TODO remove type assertion once js commons is typescript compatible
const { USER_EXTERNAL_ID } = (logging as { keys: Record<string, string> }).keys

interface ClientSessionsExpressRequest extends Request {
  session: ClientSessionsCookie
  register_invite: ClientSessionsCookie
}

interface PassportExpressRequest extends ClientSessionsExpressRequest {
  session: ClientSessionsExpressRequest['session'] & {
    regenerate: (callback: (err?: unknown) => void) => void
    save: (callback: (err?: unknown) => void) => void
  }
}

interface TwoFactorAuthenticationReq extends PassportExpressRequest {
  user: User
  body: {
    code: string
  }
}

function enforceUserFirstFactor(req: Request, res: Response, next: NextFunction) {
  const hasUser = lodash.get(req, 'user')
  const disabled = lodash.get(hasUser, 'disabled')

  if (!hasUser) return redirectToLogin(req, res)
  if (disabled === true) return noAccess(req, res, next)

  return next()
}

function noAccess(req: Request, res: Response, next: NextFunction) {
  if (req.url !== paths.user.noAccess) {
    res.redirect(paths.user.noAccess)
  } else {
    next() // don't redirect again if we're already there
  }
}

function redirectLoggedInUser(req: PassportExpressRequest, res: Response, next: NextFunction) {
  if (hasValidSession(req)) {
    return res.redirect(paths.index)
  }
  next()
}

function localStrategyAuth(username: string, password: string, done: AuthenticateCallback) {
  userService
    .authenticate(username, password)
    .then((user: User) => {
      done(null, user)
    })
    .catch(() => {
      done(null, false, { message: 'Invalid email or password' })
    })
}

function localStrategy2Fa(req: Request, done: AuthenticateCallback) {
  const request = req as TwoFactorAuthenticationReq
  const code = sanitiseSecurityCode(request.body.code)
  const validationResult = validateOtp(code)
  if (!validationResult.valid) {
    done(null, false, { message: validationResult.message })
    return
  }
  userService
    .authenticateSecondFactor(request.user.externalId, code)
    .then((user: User) => {
      done(null, user)
    })
    .catch(() => {
      const message =
        request.user.secondFactor === secondFactorMethod.SMS
          ? validationErrors.invalidOrExpiredSecurityCodeSMS
          : validationErrors.invalidOrExpiredSecurityCodeApp
      done(null, false, { message })
    })
}

function localStrategyLoginDirectAfterRegistration(req: Request, done: AuthenticateCallback) {
  const request = req as PassportExpressRequest
  const registrationSession = request.register_invite
  if (!registrationSession?.userExternalId) {
    done(null, false)
    return
  }
  userService
    .findByExternalId(registrationSession.userExternalId)
    .then((user: User) => {
      registrationSession.destroy()
      done(null, user)
    })
    .catch(() => {
      registrationSession.destroy()
      done(null, false)
    })
}

function registrationSuccess(req: PassportExpressRequest, _: Response, next: NextFunction) {
  req.session.secondFactor = 'totp'
  setSessionVersion(req)
  next()
}

function setSessionVersion(req: PassportExpressRequest) {
  req.session.version = lodash.get(req, 'user.sessionVersion', 0)
}

function redirectToLogin(req: Request, res: Response) {
  const request = req as PassportExpressRequest
  request.session.last_url = req.originalUrl
  logger.info(`Redirecting attempt to access ${request.originalUrl} to ${paths.user.logIn}`)
  res.redirect(paths.user.logIn)
}

function hasValidSession(req: PassportExpressRequest) {
  const isValid = sessionValidator.validate(req.user, req.session)
  if (!isValid && lodash.get(req, 'session.version') !== undefined) {
    logger.info(
      `Invalid session version for user. User session_version: ${lodash.get(req, 'user.sessionVersion', 0)}, session version ${lodash.get(req, 'session.version') as number}`
    )
  }
  return isValid
}

function addUserFieldsToLogContext(req: Request, _: Response, next: NextFunction) {
  const user = req.user
  if (user) {
    addField(USER_EXTERNAL_ID, user.externalId)
    addField('internal_user', `${user.internalUser}`)
  }
  next()
}

// passport 7 compatibility middleware for client-sessions
function passportClientSessionsCompatibility(req: Request, _: Response, next: NextFunction) {
  const request = req as ClientSessionsExpressRequest
  request.session.regenerate ??= (callback: (err?: unknown) => void) => {
    Object.keys(request.session).forEach((key) => {
      if (
        key !== 'reset' &&
        key !== 'setDuration' &&
        key !== 'last_url' &&
        typeof request.session[key] !== 'function'
      ) {
        delete request.session[key]
      }
    })
    if (callback) callback()
  }
  request.session.save ??= (callback: (err?: unknown) => void) => {
    if (callback) callback()
  }
  next()
}

function initialise(app: Application) {
  app.use(passportClientSessionsCompatibility)
  app.use(passport.initialize())
  app.use(passport.session())
  passport.use('local', new passportLocal.Strategy({ usernameField: 'username' }, localStrategyAuth as VerifyFunction))
  passport.use('local2Fa', new CustomStrategy(localStrategy2Fa))
  passport.use(
    'localStrategyLoginDirectAfterRegistration',
    new CustomStrategy(localStrategyLoginDirectAfterRegistration)
  )
  passport.serializeUser(serializeUser)
  passport.deserializeUser(deserializeUser)
  app.use(addUserFieldsToLogContext)
}

function deserializeUser(externalId: string, done: AuthenticateCallback) {
  userService
    .findByExternalId(externalId)
    .then((user: User) => {
      done(null, user)
    })
    .catch((err) => {
      if (err instanceof RESTClientError) {
        logger.info(
          `Failed to retrieve user, '${externalId}', from adminusers with statuscode: ${
            (
              err as {
                errorCode: string
              }
            ).errorCode
          }`
        )
      }
      done(err)
    })
}

function serializeUser(user: Express.User, done: AuthenticateCallback) {
  const payUser = user as User
  done(null, payUser.externalId)
}

export {
  enforceUserFirstFactor,
  initialise,
  deserializeUser,
  serializeUser,
  localStrategyAuth,
  localStrategy2Fa,
  localStrategyLoginDirectAfterRegistration,
  registrationSuccess,
  noAccess,
  setSessionVersion,
  redirectLoggedInUser,
}
