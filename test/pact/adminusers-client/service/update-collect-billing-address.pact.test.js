'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../fixtures/service.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient
const expect = chai.expect
const serviceExternalId = 'cp5wa'

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch collect billing address toggle', function () {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
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
          .withRequestBody(validUpdateCollectBillingAddressRequest)
          .withStatusCode(200)
          .withResponseBody(pactify(validUpdateCollectBillingAddressResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should toggle successfully', function (done) {
      adminUsersClient.updateCollectBillingAddress(serviceExternalId, false)
        .should.be.fulfilled.then(service => {
          expect(service.external_id).to.equal(serviceExternalId)
          expect(service.collect_billing_address).to.equal(false)
        }).should.notify(done)
    })
  })
})
