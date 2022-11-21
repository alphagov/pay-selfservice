'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../fixtures/service.fixtures')
const { validPaths, ServiceUpdateRequest } = require('../../../../app/models/ServiceUpdateRequest.class')
const goLiveStage = require('../../../../app/models/go-live-stage')
const pspTestAccountStage = require('../../../../app/models/psp-test-account-stage')
const { pactify } = require('../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - patch request to update service', function () {
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

  describe('a valid update service patch request to update single field', () => {
    const merchantDetailsName = 'updated-name'
    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.name, merchantDetailsName)
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
      expect(service.merchantDetails.name).to.equal(merchantDetailsName)
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

    const validUpdateServiceRequest = new ServiceUpdateRequest()
      .replace(validPaths.merchantDetails.name, merchantDetails.name)
      .replace(validPaths.merchantDetails.addressLine1, merchantDetails.address_line1)
      .replace(validPaths.merchantDetails.addressLine2, merchantDetails.address_line2)
      .replace(validPaths.merchantDetails.addressCity, merchantDetails.address_city)
      .replace(validPaths.merchantDetails.addressCountry, merchantDetails.address_country)
      .replace(validPaths.merchantDetails.addressPostcode, merchantDetails.address_postcode)
      .replace(validPaths.merchantDetails.telephoneNumber, merchantDetails.telephone_number)
      .replace(validPaths.merchantDetails.email, merchantDetails.email)
      .replace(validPaths.currentGoLiveStage, currentGoLiveStage)
      .replace(validPaths.currentPspTestAccountStage, currentPspTestAccountStage)
      .replace(validPaths.merchantDetails.url, merchantDetails.url)
      .formatPayload()

    const validUpdateServiceResponse = serviceFixtures.validServiceResponse({
      external_id: existingServiceExternalId,
      merchant_details: merchantDetails,
      current_go_live_stage: currentGoLiveStage,
      current_psp_test_account_stage: currentPspTestAccountStage
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
      expect(service.merchantDetails).to.deep.equal(merchantDetails)
      expect(service.currentGoLiveStage).to.equal(currentGoLiveStage)
      expect(service.currentPspTestAccountStage).to.equal(currentPspTestAccountStage)
    })
  })

  describe('an invalid update service patch request', () => {
    const invalidRequest = [{
      'op': 'replace',
      'non-existent-path': 'foo',
      'value': 'bar'
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
