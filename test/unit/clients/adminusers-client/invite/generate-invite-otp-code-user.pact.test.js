'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const inviteFixtures = require('../../../../fixtures/invite.fixtures')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

// Global setup

describe('adminusers client - generate otp code for user invite', () => {
  let provider = new Pact({
    consumer: 'selfservice-to-be',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())

  describe('success', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid generate user invite otp code request')
          .withMethod('POST')
          .withRequestBody(validRegistrationRequest.getPactified())
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should generate user invite otp code successfully', () => {
      const registration = validRegistrationRequest.getPlain()
      return adminusersClient.generateInviteOtpCode(inviteCode, registration.telephone_number, registration.password)
    })
  })

  describe('bad request', () => {
    const inviteCode = '7d19aff33f8948deb97ed16b2912dcd3'
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()
    validRegistrationRequest.telephone_number = ''
    const errorResponse = inviteFixtures.badRequestResponseWhenFieldsMissing(['telephone_number'])

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('invalid generate user invite otp code request')
          .withMethod('POST')
          .withRequestBody(validRegistrationRequest.getPactified())
          .withStatusCode(400)
          .withResponseBody(errorResponse.getPactified())
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should 400 BAD REQUEST telephone number is not valid', () => {
      const registration = validRegistrationRequest.getPlain()
      return adminusersClient.generateInviteOtpCode(inviteCode, registration.telephone_number, registration.password)
        .then(
          () => { throw new Error('Expected to reject') },
          (err) => {
            expect(err.errorCode).toBe(400)
            expect(err.message.errors.length).toBe(1)
            expect(err.message.errors[0]).toBe('Field [telephone_number] is required')
          }
        );
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    const validRegistrationRequest = inviteFixtures.validRegistrationRequest()

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid generate user invite otp code of a non existing invite')
          .withMethod('POST')
          .withRequestBody(validRegistrationRequest.getPactified())
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if user invite code not found', () => {
      const registration = validRegistrationRequest.getPlain()
      return adminusersClient.generateInviteOtpCode(nonExistingInviteCode, registration.telephone_number, registration.password)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
