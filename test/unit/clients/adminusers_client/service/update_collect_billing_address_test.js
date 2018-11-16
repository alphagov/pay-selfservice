'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')
const ssUserConfig = require('../../../../fixtures/config/self_service_user')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const expect = chai.expect
const ssDefaultServiceId = ssUserConfig.config.users.filter(fil => fil.isPrimary === 'true')[0].service_ids[0]

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch collect billing address toggle', function () {
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
  after((done) => provider.finalize().then(done()))

  describe('patch collect billing address toggle - disabled', () => {
    const validUpdateCollectBillingAddressRequest = serviceFixtures.validCollectBillingAddressToggleRequest({enabled: false})
    const validUpdateCollectBillingAddressResponse = serviceFixtures.validCollectBillingAddressToggleResponse({
      external_id: ssDefaultServiceId,
      collect_billing_address: false
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${ssDefaultServiceId}`)
          .withUponReceiving('a valid patch collect billing address toggle (disabled) request')
          .withState(`a service exists with external id ${ssDefaultServiceId} and billing address collection enabled`)
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
      adminusersClient.updateCollectBillingAddress(ssDefaultServiceId, false)
        .should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(ssDefaultServiceId)
          expect(service.collect_billing_address).to.equal(false)
        }).should.notify(done)
    })
  })
})
