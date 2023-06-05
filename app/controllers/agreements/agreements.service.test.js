const { expect } = require('chai')
const sinon = require('sinon')

const proxyquire = require('proxyquire')

const agreementsFixture = require('../../../test/fixtures/agreement.fixtures')

describe('agreements service', () => {
  describe('list agreements', () => {
    it('should format agreements list with standard pagination', async () => {
      const reference = 'a-valid-reference'
      const agreementsResult = agreementsFixture.validAgreementSearchResponse([
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference },
        { reference }
      ])

      const spy = sinon.spy(async () => agreementsResult)
      const service = getAgreementsService({ agreements: spy }, {})
      const accountId = 42
      const result = await service.agreements('service-id', true, accountId)

      sinon.assert.calledWith(spy, 'service-id', true, accountId, 1)

      expect(result.total).to.equal(21)
      expect(result.links.length).to.equal(3)
      expect(result.links[2].pageName).to.equal('next')
    })
  })

  describe('get an agreement', () => {
    it('should request an agreement', async () => {
      const spy = sinon.spy(async () => {})
      const service = getAgreementsService({ agreement: spy }, {})
      await service.agreement('an-external-id', 'a-service-id')
      sinon.assert.calledWith(spy, 'an-external-id', 'a-service-id')
    })
  })

  describe('cancel an agreement', () => {
    it('should cancel an agreement', async () => {
      const gatewayAccountId = '1'
      const agreementId = 'an-agreement-id'
      const userEmail = 'user@test.com'
      const userExternalId = 'a-user-external-id'

      const spy = sinon.spy(async () => {})

      const connectorClientMock = {
        ConnectorClient: function () {
          this.postCancelAgreement = spy
        }
      }

      const service = getAgreementsService({}, connectorClientMock)

      await service.cancelAgreement(gatewayAccountId, agreementId, userEmail, userExternalId)

      const cancelAgreementParams = {
        gatewayAccountId,
        agreementId,
        payload: {
          'user_email': userEmail,
          'user_external_id': userExternalId
        }
      }

      sinon.assert.calledWith(spy, cancelAgreementParams)
    })
  })
})

function getAgreementsService (ledgerClientStub = {}, connectorClientStub = {}) {
  return proxyquire('./agreements.service.js', {
    './../../services/clients/ledger.client': ledgerClientStub,
    './../../services/clients/connector.client': connectorClientStub
  })
}
