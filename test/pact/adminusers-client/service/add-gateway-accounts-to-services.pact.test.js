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
let result, request

// Global setup
chai.use(chaiAsPromised)

describe('admin users client - add gateway accounts to service', () => {
  this.timeout = 5000

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

  describe('a successful add gateway account to service request', () => {
    const gatewayAccountsIdsToAdd = ['42']
    const gatewayAccountIdsAfter = ['42', '111']
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountsIdsToAdd)
      const response = serviceFixtures.validServiceResponse({ gateway_account_ids: gatewayAccountIdsAfter })
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid request to add a gateway account to a service')
          .withState(`a service exists with external id ${serviceExternalId} with gateway account with id 111`)
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name', () => {
      result = adminUsersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountsIdsToAdd)

      return expect(result)
        .to.be.fulfilled
        .and.to.eventually.include({ externalId: serviceExternalId })
        .and.to.have.property('gatewayAccountIds').to.include(...gatewayAccountIdsAfter)
    })
  })

  describe('an unsuccessful add gateway account to service request that responds with 409', () => {
    const gatewayAccountIds = ['111']
    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountIds)
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a conflicting gateway account id')
          .withState(`a service exists with external id ${serviceExternalId} with gateway account with id 111`)
          .withMethod('PATCH')
          .withRequestBody(request)
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
      result = adminUsersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)

      return expect(result)
        .to.be.rejected.then(err => {
          expect(err.errorCode).to.equal(409)
          expect(err.message).to.equal('One or more of the following gateway account ids has already assigned to another service: [111]')
        })
    })
  })

  describe('when the service id relates to a service that does not exist', () => {
    const nonExistentServiceId = 'non-existent-id'
    const gatewayAccountIds = ['42']

    before(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountIds)
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${nonExistentServiceId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a non-extant service external id')
          .withMethod('PATCH')
          .withRequestBody(request)
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should reject with an error detailing the conflicting', () => {
      result = adminUsersClient.addGatewayAccountsToService(nonExistentServiceId, gatewayAccountIds)

      return expect(result)
        .to.be.rejected
        .and.to.eventually.have.property('errorCode').to.equal(404)
    })
  })
})
