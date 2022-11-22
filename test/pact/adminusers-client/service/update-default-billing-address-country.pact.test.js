'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../fixtures/service.fixtures')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient
const serviceExternalId = 'cp5wa'

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

  describe('patch default billing address - valid country code', () => {
    const request = serviceFixtures.validUpdateDefaultBillingAddressRequest('IE')
    const response = serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      default_billing_address_country: 'IE'
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid patch default billing address country with valid country code request')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should update successfully', async () => {
      const service = await adminUsersClient.updateDefaultBillingAddressCountry(serviceExternalId, 'IE')
      expect(service.external_id).to.equal(serviceExternalId)
      expect(service.default_billing_address_country).to.equal('IE')
    })
  })

  describe('patch default billing address - null value', () => {
    const request = serviceFixtures.validUpdateDefaultBillingAddressRequest(null)
    const response = serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      default_billing_address_country: null
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid patch default billing address country with null value request')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
    })

    afterEach(() => provider.verify())

    it('should update successfully', async () => {
      const service = await adminUsersClient.updateDefaultBillingAddressCountry(serviceExternalId, null)
      expect(service.external_id).to.equal(serviceExternalId)
      expect(service).to.not.have.property('default_billing_address_country')
    })
  })
})
