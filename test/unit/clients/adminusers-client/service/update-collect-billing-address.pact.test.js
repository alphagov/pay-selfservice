'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect
const serviceExternalId = 'cp5wa'

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch collect billing address toggle', function () {
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

  describe('patch collect billing address toggle - disabled', () => {
    const validUpdateCollectBillingAddressRequest = serviceFixtures.validCollectBillingAddressToggleRequest({ enabled: false })
    const validUpdateCollectBillingAddressResponse = serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      collect_billing_address: false
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid patch collect billing address toggle (disabled) request')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateCollectBillingAddressRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateCollectBillingAddressResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', function (done) {
      adminusersClient.updateCollectBillingAddress(serviceExternalId, false)
        .should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(serviceExternalId)
          expect(service.collect_billing_address).to.equal(false)
        }).should.notify(done)
    })
  })
})
