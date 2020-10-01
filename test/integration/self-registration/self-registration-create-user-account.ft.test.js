'use strict'

const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const { expect } = require('chai')

const mockSession = require('../../test-helpers/mock-session')
const getApp = require('../../../server').getApp
const selfRegisterFixtures = require('../../fixtures/self-register.fixtures')
const paths = require('../../../app/paths')

// Constants
const SERVICE_INVITE_RESOURCE = '/v1/api/invites/service'
const adminusersMock = nock(process.env.ADMINUSERS_URL)

// Global setup

let app

describe('create service otp validation', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should redirect to confirmation page on successful registration', function (done) {
    const validServiceRegistrationRequest = selfRegisterFixtures.validRegisterRequest()

    const request = validServiceRegistrationRequest.getPlain()
    adminusersMock.post(`${SERVICE_INVITE_RESOURCE}`, request)
      .reply(201)

    app = mockSession.getAppWithLoggedOutSession(getApp())
    supertest(app)
      .post(paths.selfCreateService.register)
      .send({
        email: request.email,
        'telephone-number': request.telephone_number,
        password: request.password,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.confirm)
      .end(done)
  })

  it('should redirect to register page if user input invalid', function (done) {
    const invalidServiceRegistrationRequest = selfRegisterFixtures.invalidEmailRegisterRequest()

    const request = invalidServiceRegistrationRequest.getPlain()
    let session = {}
    app = mockSession.getAppWithLoggedOutSession(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.register)
      .send({
        email: request.email,
        'telephone-number': request.telephone_number,
        password: request.password,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.register)
      .expect(() => {
        expect(session.pageData.submitRegistration).to.deep.equal({
          recovered: {
            email: '',
            telephoneNumber: '07912345678',
            errors: {
              email: 'Enter an email address'
            }
          }
        })
      })
      .end(done)
  })
})
