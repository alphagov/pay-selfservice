'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('@test/test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../src/services/clients/adminusers.client')
const serviceFixtures = require('@test/fixtures/service.fixtures')
const { ServiceUpdateRequest } = require('@models/ServiceUpdateRequest.class')
const goLiveStage = require('@models/constants/go-live-stage')
const pspTestAccountStage = require('@models/constants/psp-test-account-stage')
const { pactify } = require('@test/test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - patch request to update service', function () {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(async () => {
    const opts = await provider.setup()
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://127.0.0.1:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('a valid update service patch request to update single field', () => {
    const merchantDetailsName = 'updated-name'
    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .replace().merchantDetails.name(merchantDetailsName)
      .formatPayload()

    const validUpdateServiceResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: {
        name: merchantDetailsName
      }
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update single service field request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceRequest)
          .withStatusCode(200)
          .withResponseBody(pactify(validUpdateServiceResponse))
          .build())
    })

    afterEach(() => provider.verify())

    it('should update a merchant name successfully', async function () {
      const service = await adminUsersClient.updateService(existingServiceExternalId, validUpdateServiceRequest)

      expect(service.externalId).to.equal(existingServiceExternalId)
      expect(service.merchantDetails.organisationName).to.equal(merchantDetailsName)
    })
  })

  describe('a valid update service patch request to update all fields', () => {
    const merchantDetails = {
      name: 'new-name',
      address_line1: 'new-line1',
      address_line2: 'new-line2',
      address_city: 'new-city',
      address_postcode: 'E1 8QS',
      address_country: 'GB',
      telephone_number: '07700 900 982',
      email: 'foo@example.com',
      url: 'https://www.example.com'
    }
    const currentGoLiveStage = goLiveStage.ENTERED_ORGANISATION_NAME
    const currentPspTestAccountStage = pspTestAccountStage.REQUEST_SUBMITTED
    const takesPaymentsOverPhone = true

    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .replace().merchantDetails.name(merchantDetails.name)
      .replace().merchantDetails.addressLine1(merchantDetails.address_line1)
      .replace().merchantDetails.addressLine2(merchantDetails.address_line2)
      .replace().merchantDetails.addressCity(merchantDetails.address_city)
      .replace().merchantDetails.addressPostcode(merchantDetails.address_postcode)
      .replace().merchantDetails.addressCountry(merchantDetails.address_country)
      .replace().merchantDetails.telephoneNumber(merchantDetails.telephone_number)
      .replace().merchantDetails.email(merchantDetails.email)
      .replace().merchantDetails.url(merchantDetails.url)
      .replace().currentGoLiveStage(currentGoLiveStage)
      .replace().currentPspTestAccountStage(currentPspTestAccountStage)
      .replace().takesPaymentsOverPhone(takesPaymentsOverPhone)
      .formatPayload()

    const validUpdateServiceResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: merchantDetails,
      current_go_live_stage: currentGoLiveStage,
      current_psp_test_account_stage: currentPspTestAccountStage,
      takes_payments_over_phone: takesPaymentsOverPhone
    })

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service request to update all fields')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceRequest)
          .withStatusCode(200)
          .withResponseBody(pactify(validUpdateServiceResponse))
          .build())
    })

    afterEach(() => provider.verify())

    it('should update service successfully', async function () {
      const service = await adminUsersClient.updateService(existingServiceExternalId, validUpdateServiceRequest)
      expect(service.externalId).to.equal(existingServiceExternalId)
      expect(service.merchantDetails.rawResponse).to.deep.equal(merchantDetails)
      expect(service.currentGoLiveStage).to.equal(currentGoLiveStage)
      expect(service.currentPspTestAccountStage).to.equal(currentPspTestAccountStage)
      expect(service.takesPaymentsOverPhone).to.equal(takesPaymentsOverPhone)
    })
  })

  describe('an invalid update service patch request', () => {
    const invalidRequest = [{
      op: 'replace',
      'non-existent-path': 'foo',
      value: 'bar'
    }]

    before(() => {
      return provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('an invalid update service patch request')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(invalidRequest)
          .withStatusCode(400)
          .build())
    })

    afterEach(() => provider.verify())

    it('should reject promise', () => {
      return adminUsersClient.updateService(existingServiceExternalId, invalidRequest).should.be.rejected // eslint-disable-line
    })
  })
})
