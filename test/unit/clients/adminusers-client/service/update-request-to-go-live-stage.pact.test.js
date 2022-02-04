'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../test-helpers/pact/pact-interaction-builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers.client')
const serviceFixtures = require('../../../../fixtures/service.fixtures')
const { pactify } = require('../../../../test-helpers/pact/pactifier').defaultPactifier

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
let adminUsersClient
const expect = chai.expect
const serviceExternalId = 'cp5wa'

// Global setup
chai.use(chaiAsPromised)

describe('adminusers client - patch request to go live stage', function () {
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
    adminUsersClient = getAdminUsersClient({ baseUrl: `http://localhost:${opts.port}` })
  })
  after(() => provider.finalize())

  describe('patch request to go live stage', () => {
    const value = 'ENTERED_ORGANISATION_NAME'
    const validUpdateRequestToGoLiveRequest = serviceFixtures.validUpdateRequestToGoLiveRequest(value)
    const validUpdateRequestToGoLiveResponse = serviceFixtures.validServiceResponse({
      external_id: serviceExternalId,
      current_go_live_stage: 'ENTERED_ORGANISATION_NAME'
    })

    before((done) => {
      provider.addInteraction(
        new PactInteractionBuilder(`${SERVICE_RESOURCE}/${serviceExternalId}`)
          .withUponReceiving('a valid patch current go live stage request')
          .withState(`a service exists with external id ${serviceExternalId}`)
          .withMethod('PATCH')
          .withRequestBody(validUpdateRequestToGoLiveRequest)
          .withStatusCode(200)
          .withResponseBody(pactify(validUpdateRequestToGoLiveResponse))
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', function (done) {
      adminUsersClient.updateCurrentGoLiveStage(serviceExternalId, 'ENTERED_ORGANISATION_NAME')
        .should.be.fulfilled.then(service => {
          expect(service.externalId).to.equal(serviceExternalId)
          expect(service.currentGoLiveStage).to.equal('ENTERED_ORGANISATION_NAME')
        }).should.notify(done)
    })
  })
})
