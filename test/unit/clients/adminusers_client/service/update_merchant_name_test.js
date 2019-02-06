'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch request to update merchant name', function () {
  let provider = Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(done => provider.finalize().then(done()))

  describe('a valid update merchant name patch request', () => {
    const serviceExternalId = 'cp5wa'
    const serviceName = 'serviceName'
    const validUpdateMerchantNameRequest = serviceFixtures.validUpdateMerchantNameRequest('updated-merchant-details-name')
    const validUpdateMerchantNameResponse = serviceFixtures.validUpdateMerchantNameResponse({
      external_id: serviceExternalId,
      name: serviceName
    })

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid update merchant name request')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateMerchantNameRequest.getPactified())
          .withStatusCode(200)
          .withResponseBody(validUpdateMerchantNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update a merchant name successfully', (done) => {
      adminUsersClient.updateMerchantName(serviceExternalId, 'updated-merchant-details-name')
        .should.be.fulfilled.then(service => {
          expect(service.externalId).to.equal(serviceExternalId)
          expect(service.name).to.equal(serviceName)
          expect(service.merchantDetails.name).to.equal(validUpdateMerchantNameRequest.getPlain().value)
        }).should.notify(done)
    })
  })
})
