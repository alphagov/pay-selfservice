'use strict'

// NPM dependencies
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const mockSession = require('../../test_helpers/mock_session')
const getApp = require('../../../server').getApp
const selfRegisterFixtures = require('../../fixtures/self_register_fixtures')
const paths = require('../../../app/paths')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const adminusersMock = nock(process.env.ADMINUSERS_URL)

// Global setup
chai.use(chaiAsPromised)

let app

describe('create service - service naming', function () {
  afterEach((done) => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should redirect to home page on successful submission', function (done) {
    const serviceExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
    const validServiceNameRequest = selfRegisterFixtures.validServiceNameRequest()

    adminusersMock.patch(`${SERVICE_RESOURCE}/${serviceExternalId}`).reply(200)

    const request = validServiceNameRequest.getPlain()
    let session = mockSession.getUser({
      default_service_id: serviceExternalId
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.serviceNaming)
      .send({
        'service-name': request.service_name,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.user.loggedIn)
      .end(done)
  })

  it('should redirect to name your service page if user input invalid', function (done) {
    const invalidServiceNameRequest = selfRegisterFixtures.invalidServiceNameRequest()

    const request = invalidServiceNameRequest.getPlain()
    let session = mockSession.getUser()
    app = mockSession.getAppWithLoggedInUser(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.serviceNaming)
      .send({
        'service-name': request.service_name,
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.serviceNaming)
      .end(done)
  })
})
