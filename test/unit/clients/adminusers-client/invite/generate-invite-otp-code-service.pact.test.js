'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')

// Constants
const INVITE_RESOURCE = '/v1/api/invites'
let port = Math.floor(Math.random() * 48127) + 1024
let adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })

// Global setup

describe('adminusers client - generate otp code for service invite', () => {
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

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${inviteCode}/otp/generate`)
          .withState('a valid invite exists with the given invite code')
          .withUponReceiving('a valid generate service invite otp code request')
          .withMethod('POST')
          .withStatusCode(200)
          .build()
      ).then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should generate service invite otp code successfully', () => {
      return adminusersClient.generateInviteOtpCode(inviteCode)
    })
  })

  describe('not found', () => {
    const nonExistingInviteCode = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    beforeAll((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${INVITE_RESOURCE}/${nonExistingInviteCode}/otp/generate`)
          .withState('invite not exists for the given invite code')
          .withUponReceiving('a valid generate service invite otp code of a non existing invite')
          .withMethod('POST')
          .withStatusCode(404)
          .build()
      ).then(() => done())
    })

    afterEach(() => provider.verify())

    it('should 404 NOT FOUND if service invite code not found', () => {
      return adminusersClient.generateInviteOtpCode(nonExistingInviteCode)
        .then(
          () => { throw new Error('Expected to reject') },
          err => expect(err.errorCode).toBe(404)
        );
    })
  })
})
