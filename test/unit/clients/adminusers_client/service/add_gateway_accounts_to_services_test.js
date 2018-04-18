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
const random = require('../../../../../app/utils/random')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({baseUrl: `http://localhost:${port}`})
const expect = chai.expect
let serviceExternalId, result, request

// Global setup
chai.use(chaiAsPromised)

describe('AdminUsersClient - addGatewayAccountToService', () => {
  this.timeout = 5000

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

  describe('when the service id relates to a service that exists and the gatewayAccountIds refer to gateway accounts that are not currently assigned to a service', () => {
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest()
      serviceExternalId = random.randomUuid()
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid request to add a gateway account to a service')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .withStatusCode(200)
          .withResponseBody({
            external_id: serviceExternalId,
            gateway_account_ids: request.getPlain().value
          })
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name', () => {
      const gatewayAccountIds = request.getPlain().value
      result = adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)

      return expect(result)
        .to.be.fulfilled
        .and.to.eventually.include({externalId: serviceExternalId})
        .and.to.have.property('gatewayAccountIds').to.include(...gatewayAccountIds)
    })
  })

  describe('when the service id relates to a service that exists and the gatewayAccountIds refer to at least one gateway account that is already assigned to a service', () => {
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest({gatewayAccountIds: ['222', '111']})
      serviceExternalId = random.randomUuid()
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a conflicting gateway account id')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .withStatusCode(409)
          .withResponseBody({
            errors: [
              'One or more of the following gateway account ids has already assigned to another service: [111]'
            ]
          })
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should reject with an error detailing the conflicting', () => {
      const gatewayAccountIds = request.getPlain().value
      result = adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)

      return expect(result)
        .to.be.rejected
        .and.to.eventually.deep.equal({
          errorCode: 409,
          message: {
            errors: [
              'One or more of the following gateway account ids has already assigned to another service: [111]'
            ]
          }
        })
    })
  })

  describe('when the service id relates to a service that exists and the gatewayAccountIds includes at least one string with non-numeric values', () => {
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest({gatewayAccountIds: ['222', 'ABC']})
      serviceExternalId = random.randomUuid()
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('an invalid request to add a gateway account to a service with a non-numeric gateway account id')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .withStatusCode(400)
          .withResponseBody({
            errors: [
              'Field [gateway_account_ids] must contain numeric values'
            ]
          })
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should reject with an error detailing the conflicting', () => {
      const gatewayAccountIds = request.getPlain().value
      result = adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)

      return expect(result)
        .to.be.rejected
        .and.to.eventually.deep.equal({
          errorCode: 400,
          message: {
            errors: [
              'Field [gateway_account_ids] must contain numeric values'
            ]
          }
        })
    })
  })

  describe('when the service id relates to a service that does not exist', () => {
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest()
      serviceExternalId = random.randomUuid()
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a non-extant service external id')
          .withMethod('PATCH')
          .withRequestBody(request.getPactified())
          .withStatusCode(404)
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should reject with an error detailing the conflicting', () => {
      const gatewayAccountIds = request.getPlain().value
      result = adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)

      return expect(result)
        .to.be.rejected
        .and.to.eventually.have.property('errorCode').to.equal(404)
    })
  })
})
