'use strict'

const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')

const path = require('path')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const registerFixtures = require('../../../../fixtures/self-register.fixtures')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// Globals

const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

const INVITE_PATH = '/v1/api/invites'

describe('adminusers client - self register service', function () {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('success', () => {
    const validRegistration = registerFixtures.validRegisterRequest()

    const pactified = validRegistration.getPactified()
    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_PATH}/service`)
          .withUponReceiving('a valid self create service request')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(201)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should send a notification successfully', function () {
      const register = validRegistration.getPlain()

      return adminusersClient.submitServiceRegistration(register.email, register.telephone_number, register.password).then(function (response) {
      })
    })
  })

  describe('bad request', () => {
    const invalidInvite = registerFixtures.invalidEmailRegisterRequest()
    const errorResponse = registerFixtures.badRequestResponseWhenFieldsMissing(['email'])

    before((done) => {
      const pactified = invalidInvite.getPactified()

      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_PATH}/service`)
          .withUponReceiving('an invalid service registration request for an empty email')
          .withMethod('POST')
          .withRequestBody(pactified)
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return bad request', function () {
      const register = invalidInvite.getPlain()

      return adminusersClient.submitServiceRegistration(register.email, register.telephone_number, register.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).to.equal(400)
            expect(err.message.errors.length).to.equal(1)
            expect(err.message.errors).to.deep.equal(errorResponse.getPlain().errors)
          }
        )
    })
  })
})
