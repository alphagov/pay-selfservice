'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')

// Global setup

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const existingServiceExternalId = 'cp5wa'

describe('adminusers client - update service name', () => {
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

  describe('success with en and cy', () => {
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest(serviceName)
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceName.en,
      external_id: existingServiceExternalId,
      service_name: serviceName
    })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with en and cy')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name for en and cy', () => {
      return adminusersClient.updateServiceName(existingServiceExternalId, serviceName.en, serviceName.cy)
        .then(service => {
          expect(service.external_id).toBe(existingServiceExternalId)
          expect(service.name).toBe(serviceName.en)
          expect(service.service_name.en).toBe(serviceName.en)
          expect(service.service_name.cy).toBe(serviceName.cy)
        });
    })
  })

  describe('success with en and empty string for cy', () => {
    const serviceNameEn = 'en-name'
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest({
      en: serviceNameEn,
      cy: ''
    })
    const validUpdateServiceNameResponse = serviceFixtures.validServiceResponse({
      name: serviceNameEn,
      external_id: existingServiceExternalId,
      service_name: {
        en: 'en-name'
      }
    })

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${existingServiceExternalId}`)
          .withUponReceiving('a valid update service name request with empty string for cy name')
          .withState(`a service exists with external id ${existingServiceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateServiceNameResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update service name with empty string for cy', () => {
      return adminusersClient.updateServiceName(existingServiceExternalId, serviceNameEn)
        .then(service => {
          expect(service.external_id).toBe(existingServiceExternalId)
          expect(service.name).toBe(serviceNameEn)
          expect(service.service_name.en).toBe(serviceNameEn)
        });
    })
  })

  describe('not found', () => {
    const nonExistentServiceExternalId = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const serviceName = {
      en: 'en-name',
      cy: 'cy-name'
    }
    const validUpdateServiceNameRequest = serviceFixtures.validUpdateServiceNameRequest(serviceName)

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${nonExistentServiceExternalId}`)
          .withUponReceiving('an invalid update service name request - service not found')
          .withMethod('PATCH')
          .withRequestBody(validUpdateServiceNameRequest.getPactified())
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return not found if service not exist', () => {
      return adminusersClient.updateServiceName(nonExistentServiceExternalId, serviceName.en, serviceName.cy)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
