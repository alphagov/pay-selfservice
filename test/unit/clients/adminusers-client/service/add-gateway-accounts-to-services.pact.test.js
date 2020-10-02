'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const serviceExternalId = 'cp5wa'
let request

// Global setup

describe('admin users client - add gateway accounts to service', () => {
  this.timeout = 5000

  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('a successful add gateway account to service request', () => {
    const gatewayAccountsIdsToAdd = ['42']
    const gatewayAccountIdsAfter = ['42', '111']
    beforeAll(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountsIdsToAdd)
      const response = serviceFixtures.validServiceResponse({ gateway_account_ids: gatewayAccountIdsAfter })
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid request to add a gateway account to a service')
          .withState(`a service exists with external id ${serviceExternalId} with gateway account with id 111`)
          .withMethod('PATCH')
          .withRequestBody(request.getPlain())
          .withStatusCode(200)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name', () => {
      return adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountsIdsToAdd)
        .then((result) => {
          expect(result).to.have.property('externalId').toBe(serviceExternalId)
          expect(result).toEqual(expect.arrayContaining([...gatewayAccountIdsAfter]))
        });
    })
  })

  describe('an unsuccessful add gateway account to service request that responds with 409', () => {
    const gatewayAccountIds = ['111']
    beforeAll(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountIds)
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a conflicting gateway account id')
          .withState(`a service exists with external id ${serviceExternalId} with gateway account with id 111`)
          .withMethod('PATCH')
          .withRequestBody(request.getPlain())
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
      return adminusersClient.addGatewayAccountsToService(serviceExternalId, gatewayAccountIds)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err).toEqual({
              errorCode: 409,
              message: {
                errors: [
                  'One or more of the following gateway account ids has already assigned to another service: [111]'
                ]
              }
            })
          }
        );
    })
  })

  describe('when the service id relates to a service that does not exist', () => {
    const nonExistentServiceId = 'non-existent-id'
    const gatewayAccountIds = ['42']

    beforeAll(done => {
      request = serviceFixtures.addGatewayAccountsRequest(gatewayAccountIds)
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${nonExistentServiceId}`)
          .withUponReceiving('a invalid request to add a gateway account to a service with a non-extant service external id')
          .withMethod('PATCH')
          .withRequestBody(request.getPlain())
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should reject with an error detailing the conflicting', () => {
      return adminusersClient.addGatewayAccountsToService(nonExistentServiceId, gatewayAccountIds)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
