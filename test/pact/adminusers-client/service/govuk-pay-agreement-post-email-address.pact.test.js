'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../app/services/clients/adminusers.client')
const validPostGovUkPayAgreementRequest = require('../../../fixtures/go-live-requests.fixture').validPostGovUkPayAgreementRequest

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient

const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
const serviceExternalId = 'cp5wa'
// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - post govuk pay agreement - email address', () => {
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

  describe('post email address', () => {
    const payload = { user_external_id: userExternalId }
    const validGovUkAgreementUserEmailRequest = validPostGovUkPayAgreementRequest(payload)

    before(done => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}/govuk-pay-agreement`)
          .withUponReceiving('a valid post govuk pay agreement - email address request')
          .withState(`a user exists with external id ${userExternalId} with admin role for service with id ${serviceExternalId}`)
          .withMethod('POST')
          .withRequestBody(validGovUkAgreementUserEmailRequest)
          .withStatusCode(201)
          .withResponseHeaders({})
          .build()
      )
        .then(() => { done() })
    })

    afterEach(() => provider.verify())

    it('should post email address successfully', done => {
      adminUsersClient.addGovUkAgreementEmailAddress(serviceExternalId, userExternalId)
        .should.be.fulfilled.should.notify(done)
    })
  })
})
