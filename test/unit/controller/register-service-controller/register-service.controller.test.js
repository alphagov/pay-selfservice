'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const lodash = require('lodash')
const { expect } = require('chai')
const paths = require('../../../../app/paths.js')

describe('Initial registration submission', function () {
  let req, res, next

  beforeEach(() => {
    req = {
      correlationId: 'abcde12345',
      body: {
        email: 'foo@example.com',
        'telephone-number': '07512345678',
        password: 'password1234'
      },
      flash: sinon.spy()
    }

    res = {
      setHeader: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
  })

  const controllerWithStubbedAdminusersSuccess = proxyquire('../../../../app/controllers/register-service.controller.js', {
    '../services/service-registration.service': {
      submitRegistration: () => Promise.resolve()
    }
  })

  const getControllerWithStubbedAdminusersError = function (error) {
    return proxyquire('../../../../app/controllers/register-service.controller.js',
      {
        '../services/service-registration.service': {
          submitRegistration: () => Promise.reject(error)
        }
      })
  }

  it('should redirect to the registration submitted page when successful', async () => {
    await controllerWithStubbedAdminusersSuccess.submitRegistration(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
  })

  it('should redirect with error stating email has to be a public sector email when adminusers responds with a 403', async () => {
    const errorFromAdminusers = {
      errorCode: 403
    }

    await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res, next)

    const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered')
    expect(recovered).to.deep.equal({
      email: req.body.email,
      telephoneNumber: req.body['telephone-number'],
      errors: {
        email: 'Enter a public sector email address'
      }
    })
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
  })

  it('should continue to confirmation page when adminusers returns a 409', async () => {
    const errorFromAdminusers = {
      errorCode: 409
    }

    await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
  })

  it('should redirect with error whan an invalid phone number is entered', async () => {
    req.body['telephone-number'] = 'acb1234567' // pragma: allowlist secret

    await controllerWithStubbedAdminusersSuccess.submitRegistration(req, res, next)
    const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered')
    expect(recovered).to.deep.equal({
      email: req.body.email,
      telephoneNumber: req.body['telephone-number'],
      errors: {
        telephoneNumber: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
      }
    })
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
  })

  it('should call next with error for unexpected error from adminusers', async () => {
    const error = {
      errorCode: 404
    }

    await getControllerWithStubbedAdminusersError(error).submitRegistration(req, res, next)
    sinon.assert.calledWith(next, error)
  })
})

describe('Set password and phone number submission', function () {
  let req, res, next

  beforeEach(() => {
    req = {
      correlationId: 'abcde12345',
      register_invite: {
        email: 'foo@example.com',
        code: '12345'
      },
      body: {
        'telephone-number': '07512345678',
        password: 'password1234'
      },
      flash: sinon.spy()
    }

    res = {
      setHeader: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
  })

  const controllerWithStubbedAdminusersSuccess = proxyquire('../../../../app/controllers/register-service.controller.js', {
    '../services/service-registration.service': {
      submitPasswordAndPhoneNumberAndSendOtp: () => Promise.resolve()
    }
  })

  const getControllerWithStubbedAdminusersError = function (error) {
    return proxyquire('../../../../app/controllers/register-service.controller.js',
      {
        '../services/service-registration.service': {
          submitPasswordAndPhoneNumberAndSendOtp: () => Promise.reject(error)
        }
      })
  }

  it('should redirect to the OTP verify page when successful', async () => {
    await controllerWithStubbedAdminusersSuccess.submitYourPassword(req, res, next)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.otpVerify)
  })

  it('should redirect with error whan an invalid phone number is entered', async () => {
    req.body['telephone-number'] = 'not a number'

    await controllerWithStubbedAdminusersSuccess.submitYourPassword(req, res, next)
    const recovered = lodash.get(req, 'register_invite.recovered')
    expect(recovered).to.deep.equal({
      telephoneNumber: req.body['telephone-number'],
      errors: {
        telephoneNumber: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
      }
    })
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.setPassword)
  })

  it('should redirect with error whan an invalid password is entered', async () => {
    req.body['telephone-number'] = '01134960000'
    req.body.password = 'tooshort' // pragma: allowlist secret

    await controllerWithStubbedAdminusersSuccess.submitYourPassword(req, res, next)
    const recovered = lodash.get(req, 'register_invite.recovered')
    expect(recovered).to.deep.equal({
      telephoneNumber: req.body['telephone-number'],
      errors: {
        password: 'Password must be 10 characters or more' // pragma: allowlist secret
      }
    })
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.setPassword)
  })

  it('should call next with error for unexpected error from adminusers', async () => {
    const error = {
      errorCode: 404
    }

    await getControllerWithStubbedAdminusersError(error).submitYourPassword(req, res, next)
    sinon.assert.calledWith(next, error)
  })
})