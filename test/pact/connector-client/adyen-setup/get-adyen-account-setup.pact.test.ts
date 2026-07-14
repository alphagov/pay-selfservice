import { Pact, SpecificationVersion } from '@pact-foundation/pact'
import path from 'path'
import chai from 'chai'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import { V4MockServer } from '@pact-foundation/pact/src/v4/http/types'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { AdyenAccountSetup } from '@models/gateway-account/AdyenAccountSetup.class'
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'

const expect = chai.expect

const SERVICE_EXTERNAL_ID = 'valid-external-service-id'
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'valid-credential-external-id'

describe('connector client - get adyen account setup', () => {
  const provider = new Pact({
    consumer: 'selfservice',
    provider: 'connector',
    // @ts-expect-error this has never actually been a supported feature in Pact
    // see https://github.com/pact-foundation/pact-js/issues/954
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
    pactfileWriteMode: 'merge',
  })

  it('should successfully return the adyen account setup', async () => {
    const adyenAccountSetup = new AdyenAccountSetupFixture({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      credentialExternalId: CREDENTIAL_EXTERNAL_ID,
    })

    await provider
      .addInteraction()
      .given('an adyen gateway account exists')
      .uponReceiving('a valid adyen account setup request')
      .pending()
      .withRequest(
        'GET',
        `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`
      )
      .willRespondWith(200, (builder) => {
        builder.jsonBody(adyenAccountSetup.toAdyenAccountSetupData())
      })
      .executeTest<void>(async (mockServer: V4MockServer) => {
        const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)

        return connectorClient.gatewayAccounts.adyenSetup
          .get(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID)
          .should.be.fulfilled.then((adyenSetup: AdyenAccountSetup) => {
            expect(adyenSetup.serviceExternalId).to.equal(SERVICE_EXTERNAL_ID)
            expect(adyenSetup.credentialExternalId).to.equal(CREDENTIAL_EXTERNAL_ID)
            expect(adyenSetup.tasks).to.deep.equal({
              unknownTask: 'NOT_STARTED',
            })
          })
      })
  })

  it('should return 404 if the gateway account is not found', async () => {
    await provider
      .addInteraction()
      .uponReceiving('a valid adyen account setup request')
      .pending()
      .withRequest(
        'GET',
        `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`
      )
      .willRespondWith(404)
      .executeTest<void>(async (mockServer: V4MockServer) => {
        const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)

        return connectorClient.gatewayAccounts.adyenSetup
          .get(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID)
          .should.be.rejectedWith(RESTClientError)
          .then((error: RESTClientError) => {
            error.errorCode.should.eq(404)
          })
      })
  })

  it('should return 404 if the gateway account credential is not found', async () => {
    await provider
      .addInteraction()
      .given('an adyen gateway account exists')
      .uponReceiving('a valid adyen account setup request')
      .pending()
      .withRequest(
        'GET',
        `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/this-credential-does-not-exist`
      )
      .willRespondWith(404)
      .executeTest<void>(async (mockServer: V4MockServer) => {
        const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)

        return connectorClient.gatewayAccounts.adyenSetup
          .get(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'this-credential-does-not-exist')
          .should.be.rejectedWith(RESTClientError)
          .then((error: RESTClientError) => {
            error.errorCode.should.eq(404)
          })
      })
  })

  it('should return 404 if the gateway account is not an Adyen account', async () => {
    await provider
      .addInteraction()
      .given('a stripe gateway account with external id 42 exists in the database')
      .uponReceiving('a valid adyen account setup request')
      .pending()
      .withRequest(
        'GET',
        `/v1/api/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/adyen-setup/${CREDENTIAL_EXTERNAL_ID}`
      )
      .willRespondWith(404)
      .executeTest<void>(async (mockServer: V4MockServer) => {
        const connectorClient = new ConnectorClient(`http://127.0.0.1:${mockServer.port}`)

        return connectorClient.gatewayAccounts.adyenSetup
          .get(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID)
          .should.be.rejectedWith(RESTClientError)
          .then((error: RESTClientError) => {
            error.errorCode.should.eq(404)
          })
      })
  })
})
