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

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch psp test account stage', function () {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://127.0.0.1:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('patch request to update psp test account stage', () => {
    const value = 'REQUEST_SUBMITTED'
    const validUpdatePspTestAccountStage = serviceFixtures.validUpdatePspTestAccountStage(value)
    const validUpdatePspTestAccountStageResponse = serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      current_psp_test_account_stage: 'REQUEST_SUBMITTED'
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid patch current psp test account stage')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdatePspTestAccountStage)
          .withStatusCode(200)
          .withResponseBody(pactify(validUpdatePspTestAccountStageResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', function (done) {
      adminUsersClient.updatePspTestAccountStage(serviceExternalId, 'REQUEST_SUBMITTED')
        .should.be.fulfilled.then(service => {
          expect(service.externalId).to.equal(serviceExternalId)
          expect(service.currentPspTestAccountStage).to.equal('REQUEST_SUBMITTED')
        }).should.notify(done)
    })
  })
})
