'use strict'

const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const mockSession = require('../../test-helpers/mock-session')
const getApp = require('../../../server').getApp
const paths = require('../../../app/paths')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const ACCOUNT_RESOURCE = '/v1/frontend/accounts'
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const connectorMock = nock(process.env.CONNECTOR_URL)

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
    const request = { service_name: 'My Service name' }
    const session = mockSession.getUser({ default_service_id: serviceExternalId })
    const service = session.serviceRoles[0].service
    const gatewayAccountId = service.gatewayAccountIds[0]
    const gatewayAccount = {
      bob: 'bob',
      type: 'test',
      payment_provider: 'sandbox',
      external_id: 'some-account-external-id'
    }

    connectorMock.get(`${ACCOUNT_RESOURCE}/${gatewayAccountId}`).reply(200, gatewayAccount)
    adminusersMock.patch(`${SERVICE_RESOURCE}/${serviceExternalId}`).reply(200, Object.assign({}, service, { name: request.service_name }))
    connectorMock.patch(`${ACCOUNT_RESOURCE}/${gatewayAccountId}`).reply(200)

    app = mockSession.getAppWithLoggedInUser(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.serviceNaming)
      .send({
        'service-name': request.service_name,
        'service-name-cy': '',
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', '/account/some-account-external-id/dashboard')
      .end(done)
  })
  it('should redirect to name your service page if user input invalid', function (done) {
    const request = { service_name: '' }
    const session = mockSession.getUser()
    app = mockSession.getAppWithLoggedInUser(getApp(), session)
    supertest(app)
      .post(paths.selfCreateService.serviceNaming)
      .send({
        'service-name': request.service_name,
        'service-name-cy': '',
        csrfToken: csrf().create('123')
      })
      .expect(303)
      .expect('Location', paths.selfCreateService.serviceNaming)
      .end(done)
  })
})
