'use strict'

const { Pact } = require('@pact-foundation/pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const path = require('path')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getAdminUsersClient = require('../../../../../app/services/clients/adminusers_client')
const serviceFixtures = require('../../../../fixtures/service_fixtures')

// Constants
const SERVICE_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024
const adminusersClient = getAdminUsersClient({ baseUrl: `http://localhost:${port}` })
const expect = chai.expect
const serviceExternalId = 'cp5wa'

chai.use(chaiAsPromised)

describe('adminusers client - patch request to go live stage', function () {
  let provider = new Pact({
    consumer: 'selfservice',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
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
          .withRequestBody(validUpdateRequestToGoLiveRequest.getPlain())
          .withStatusCode(200)
          .withResponseBody(validUpdateRequestToGoLiveResponse.getPactified())
          .build()
      )
        .then(() => done())
        .catch(done)
    })

    afterEach(() => provider.verify())

    it('should update successfully', function (done) {
      adminusersClient.updateCurrentGoLiveStage(serviceExternalId, 'ENTERED_ORGANISATION_NAME')
        .should.be.fulfilled.then(service => {
          expect(service.externalId).to.equal(serviceExternalId)
          expect(service.currentGoLiveStage).to.equal('ENTERED_ORGANISATION_NAME')
        }).should.notify(done)
    })
  })
})
