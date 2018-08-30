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
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - create a new service', function () {
  let provider = Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(done()))

  describe('success', () => {
    const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with empty object')
          .withMethod('POST')
          .withRequestBody({})
          .withStatusCode(201)
          .withResponseBody(validCreateServiceResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService().should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal('externalId')
        expect(service.name).to.equal('System Generated')
        expect(service.gateway_account_ids).to.deep.equal([])
      }).should.notify(done)
    })
  })

  describe('create a service sending gateway account ids - success', () => {
    const validRequest = serviceFixtures.validCreateServiceRequest({gateway_account_ids: ['1', '5']})
    const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse(validRequest.getPlain())

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with gateway account ids')
          .withMethod('POST')
          .withRequestBody(validRequest.getPactified())
          .withStatusCode(201)
          .withResponseBody(validCreateServiceResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService(null, null, validRequest.getPlain().gateway_account_ids).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal('externalId')
        expect(service.name).to.equal('System Generated')
        expect(service.gateway_account_ids).to.deep.equal(validCreateServiceResponse.getPlain().gateway_account_ids)
      }).should.notify(done)
    })
  })

  describe('create a service sending service name - success', () => {
    const validRequest = serviceFixtures.validCreateServiceRequest({name: 'Service name'})
    const validCreateServiceResponse = serviceFixtures.validCreateServiceResponse(validRequest.getPlain())

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('a valid create service request with service name')
          .withMethod('POST')
          .withRequestBody(validRequest.getPactified())
          .withStatusCode(201)
          .withResponseBody(validCreateServiceResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should create a new service', function (done) {
      adminusersClient.createService('Service name', null, null).should.be.fulfilled.then(service => {
        expect(service.external_id).to.equal('externalId')
        expect(service.name).to.equal('Service name')
        expect(service.gateway_account_ids).to.deep.equal([])
      }).should.notify(done)
    })
  })

  describe('create a service - bad request', () => {
    const invalidRequest = serviceFixtures.validCreateServiceRequest({gateway_account_ids: ['non-numeric-id']})
    const errorResponse = serviceFixtures.badRequestResponseWhenNonNumericGatewayAccountIds(['non-numeric-id'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(SERVICE_RESOURCE)
          .withUponReceiving('an invalid create service request')
          .withMethod('POST')
          .withRequestBody(invalidRequest.getPactified())
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return 400 on invalid gateway account ids', function (done) {
      adminusersClient.createService( null, null, ['non-numeric-id']).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(errorResponse.getPlain().errors)
      }).should.notify(done)
    })
  })
})
