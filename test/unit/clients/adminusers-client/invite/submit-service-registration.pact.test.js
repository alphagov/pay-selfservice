'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const registerFixtures = require('../../../../fixtures/self-register.fixtures')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Globals

chai.use(chaiAsPromised)

const expect = chai.expect
let adminUsersClient

const INVITE_PATH = '/v1/api/invites'

describe('adminusers client - self register service', function () {
  const provider = new Pact({
    consumer: 'selfservice-to-be',
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

  describe('success', () => {
    const validRegistration = registerFixtures.validRegisterRequest()

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_PATH}/service`)
          .withUponReceiving('a valid self create service request')
          .withMethod('POST')
          .withRequestBody(validRegistration)
          .withStatusCode(201)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should send a notification successfully', function (done) {
      adminUsersClient.submitServiceRegistration(validRegistration.email, validRegistration.telephone_number, validRegistration.password).should.be.fulfilled.then(function (response) {
      }).should.notify(done)
    })
  })

  describe('bad request', () => {
    const invalidInvite = registerFixtures.validRegisterRequest()
    const errorResponse = registerFixtures.badRequestResponseWhenFieldsMissing(['email'])

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_PATH}/service`)
          .withUponReceiving('an invalid service registration request for an empty email')
          .withMethod('POST')
          .withRequestBody(invalidInvite)
          .withStatusCode(400)
          .withResponseBody(pactify(errorResponse))
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should return bad request', function (done) {
      adminUsersClient.submitServiceRegistration(invalidInvite.email, invalidInvite.telephone_number, invalidInvite.password).should.be.rejected.then(function (response) {
        expect(response.errorCode).to.equal(400)
        expect(response.message.errors.length).to.equal(1)
        expect(response.message.errors).to.deep.equal(errorResponse.errors)
      }).should.notify(done)
    })
  })
})
