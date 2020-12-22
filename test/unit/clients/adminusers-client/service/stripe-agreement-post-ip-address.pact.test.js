'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const validPostStripeAgreementRequest = require('../../../../fixtures/go-live-requests.fixture').validPostStripeAgreementRequest

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const serviceExternalId = 'rtglNotStarted'

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - post stripe agreement - ip address', () => {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('post ip address', () => {
    const ipAddress = '93.184.216.34' // example.org
    const opts = { ip_address: ipAddress }
    const validStripeAgreementRequest = validPostStripeAgreementRequest(opts)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}/stripe-agreement`)
          .withUponReceiving('a valid post stripe agreement - ip address request')
          .withState(`a service exists with external id ${serviceExternalId} and go live stage equals to NOT_STARTED`)
          .withMethod('POST')
          .withRequestBody(validStripeAgreementRequest)
          .withStatusCode(201)
          .withResponseHeaders({})
          .build()
      )
        .then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should post ip address successfully', done => {
      adminusersClient.addStripeAgreementIpAddress(serviceExternalId, ipAddress)
        .should.be.fulfilled.should.notify(done)
    })
  })
})
