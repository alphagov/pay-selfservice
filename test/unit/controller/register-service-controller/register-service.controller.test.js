'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const lodash = require('lodash')
const { expect } = require('chai')
const paths = require('../../../../app/paths.js')

const gatewayAccountFixtures = require('../../../fixtures/gateway-account.fixtures')
const userFixtures = require('../../../fixtures/user.fixtures')
const inviteFixtures = require('../../../fixtures/invite.fixtures')
const User = require('../../../../app/models/User.class')

const gatewayAccountExternalId = 'an-external-id'

describe('Register service', function () {
  let req, res, next, updateServiceNameSpy

  beforeEach(() => {
    req = {
      flash: sinon.spy()
    }

    res = {
      setHeader: sinon.spy(),
      redirect: sinon.spy(),
      render: sinon.spy(),
      status: sinon.spy()
    }
    next = sinon.spy()
    updateServiceNameSpy = sinon.spy()
  })

  function getControllerWithStubs () {
    return proxyquire('../../../../app/controllers/register-service.controller.js', {
      '../services/service-registration.service': {
        submitRegistration: () => Promise.resolve()
      },
      '../services/service.service': {
        updateServiceName: updateServiceNameSpy
      },
      '../services/clients/connector.client': {
        ConnectorClient: function () {
          this.getAccount = () => Promise.resolve(gatewayAccountFixtures.validGatewayAccountResponse({
            external_id: gatewayAccountExternalId
          }))
        }
      }
    })
  }

  function getControllerWithStubbedAdminusersError (error) {
    return proxyquire('../../../../app/controllers/register-service.controller.js',
      {
        '../services/service-registration.service': {
          submitRegistration: () => Promise.reject(error)
        }
      })
  }

  describe('Submit registration', () => {
    beforeEach(() => {
      req.body = {
        email: 'foo@example.com',
        'telephone-number': '07512345678',
        password: 'password1234'
      }
    })

    it('should redirect to the registration submitted page when successful', async () => {
      await getControllerWithStubs().submitRegistration(req, res, next)
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

      await getControllerWithStubs().submitRegistration(req, res, next)
      const recovered = lodash.get(req, 'session.pageData.submitRegistration.recovered')
      expect(recovered).to.deep.equal({
        email: req.body.email,
        telephoneNumber: req.body['telephone-number'],
        errors: {
          telephoneNumber: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
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

  describe('Submit OTP code', () => {
    const userExternalId = 'a-user-id'
    describe('adminusers complete response has a service_external_id', () => {
      const controller = proxyquire('../../../../app/controllers/register-service.controller.js',
        {
          '../services/service-registration.service': {
            completeInvite: () => Promise.resolve(inviteFixtures.validInviteCompleteResponse({ user_external_id: userExternalId })),
            submitServiceInviteOtpCode: () => Promise.resolve()
          }
        })

      it('should redirect to route to log user in then name the service', async () => {
        req.body = {
          'verify-code': '123456'
        }
        req.register_invite = {
          code: 'a-code',
          email: 'an-email'
        }
        await controller.submitOtpCode(req, res, next)
        sinon.assert.calledWith(res.redirect, 303, paths.selfCreateService.logUserIn)
      })
    })

    describe('adminusers complete response does not have a service_external_id', () => {
      const controller = proxyquire('../../../../app/controllers/register-service.controller.js',
        {
          '../services/service-registration.service': {
            completeInvite: () => Promise.resolve(inviteFixtures.inviteCompleteResponseWithNoServiceExternalId({ user_external_id: userExternalId })),
            submitServiceInviteOtpCode: () => Promise.resolve()
          }
        })

      it('should redirect to route to log user in then show the my service page', async () => {
        req.body = {
          'verify-code': '123456'
        }
        req.register_invite = {
          code: 'a-code',
          email: 'an-email'
        }
        await controller.submitOtpCode(req, res, next)
        sinon.assert.calledWith(res.redirect, 303, paths.registerUser.logUserIn)
      })
    })
  })

  describe('Load service name page', () => {
    it('should load page when the user has a service with the default name', () => {
      req.user = new User(userFixtures.validUserResponse({
        service_roles: [
          {
            service: {
              service_name: {
                en: 'System Generated'
              }
            }
          }
        ]
      }))
      getControllerWithStubs().showNameYourService(req, res, next)
      sinon.assert.calledWith(res.render, 'self-create-service/set-name', {})
    })

    it('should redirect to "My services" page when user does not have a service with the default name', () => {
      req.user = new User(userFixtures.validUserResponse({
        service_roles: [
          {
            service: {
              service_name: {
                en: 'Not a default service'
              }
            }
          }
        ]
      }))
      getControllerWithStubs().showNameYourService(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, '/my-services')
    })
  })

  describe('Set service name', () => {
    const newServiceName = 'New service name'
    const serviceExternalId = 'service-to-rename-service-id'

    it('should set the name for the service with the default name that was created during sign-up and redirect to the account dashboard', async () => {
      req.body = {
        'service-name': newServiceName
      }
      req.user = new User(userFixtures.validUserResponse({
        service_roles: [
          {
            service: {
              service_name: {
                en: 'Not a default service'
              }
            }
          },
          {
            service: {
              external_id: serviceExternalId,
              service_name: {
                en: 'System Generated'
              }
            }
          }
        ]
      }))

      await getControllerWithStubs().submitYourServiceName(req, res, next)
      sinon.assert.calledWith(updateServiceNameSpy, serviceExternalId, newServiceName, null)
      sinon.assert.calledWith(res.redirect, 303, `/account/${gatewayAccountExternalId}/dashboard`)
    })

    it('should call next with an error when there is no service with the default name to rename', async () => {
      req.body = {
        'service-name': newServiceName
      }
      req.user = new User(userFixtures.validUserResponse({
        service_roles: [
          {
            service: {
              service_name: {
                en: 'Not a default service'
              }
            }
          }
        ]
      }))

      await getControllerWithStubs().submitYourServiceName(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Attempting to set name for service during registration but a service with name "System Generated" was not found'))
      sinon.assert.calledWith(next, expectedError)
      sinon.assert.notCalled(res.redirect)
    })

    it('should redirect with an error message in the session when the service name is empty', async () => {
      req.body = {
        'service-name': ''
      }
      await getControllerWithStubs().submitYourServiceName(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, `/service/set-name`)
      expect(req.session.pageData.submitYourServiceName).to.deep.equal({
        errors: {
          service_name: 'Enter a service name'
        },
        serviceName: ''
      })
    })

    it('should redirect with an error message in the session when the service name is too long', async () => {
      const serviceName = 'Lorem ipsum dolor sit amet, consectetuer adipiscing'
      req.body = {
        'service-name': serviceName
      }
      await getControllerWithStubs().submitYourServiceName(req, res, next)
      sinon.assert.calledWith(res.redirect, 303, `/service/set-name`)
      expect(req.session.pageData.submitYourServiceName).to.deep.equal({
        errors: {
          service_name: 'Service name must be 50 characters or fewer'
        },
        serviceName: serviceName
      })
    })
  })
})
