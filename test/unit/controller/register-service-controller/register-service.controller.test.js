'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../../app/paths.js')

describe('Register service', function () {
  let req, res

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
    await controllerWithStubbedAdminusersSuccess.submitRegistration(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
  })

  it('should relay validation message from adminusers when it responds with a 400', async () => {
    const errorMessage = `message from adminusers`
    const errorFromAdminusers = {
      errorCode: 400,
      message: {
        errors: errorMessage
      }
    }

    await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res)

    sinon.assert.calledWith(req.flash, 'genericError', errorMessage)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
  })

  it('should relay validation message from adminusers when it responds with a 403', async () => {
    const errorMessage = `message from adminusers`
    const errorFromAdminusers = {
      errorCode: 403,
      message: {
        errors: errorMessage
      }
    }

    await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res)

    sinon.assert.calledWith(req.flash, 'genericError', errorMessage)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
  })

  it('should continue to confirmation page when adminusers returns a 409', async () => {
    const errorFromAdminusers = {
      errorCode: 409
    }

    await getControllerWithStubbedAdminusersError(errorFromAdminusers).submitRegistration(req, res)
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.confirm)
  })

  it('should show error whan an invalid phone number is entered', async () => {
    req.body['telephone-number'] = 'acb1234567'

    await controllerWithStubbedAdminusersSuccess.submitRegistration(req, res)
    sinon.assert.calledWith(req.flash, 'genericError', 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
    sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.register)
  })

  it('should show error page for unexpected error from adminusers', async () => {
    const error = {
      errorCode: 404
    }

    await getControllerWithStubbedAdminusersError(error).submitRegistration(req, res)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })
})
