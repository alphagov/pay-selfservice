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
        { reference }
      ])

      const spy = sinon.spy(async () => agreementsResult)
      const service = getAgreementsService({ agreements: spy })
      const result = await service.agreements('service-id', true)

      sinon.assert.calledWith(spy, 'service-id', true, 1)

      expect(result.total).to.equal(16)
      expect(result.links.length).to.equal(3)
      expect(result.links[2].pageName).to.equal('next')
    })
  })
  describe('get an agreement', () => {
    it('should request an agreement', async () => {
      const spy = sinon.spy(async () => {})
      const service = getAgreementsService({ agreement: spy })
      await service.agreement('an-external-id', 'a-service-id')
      sinon.assert.calledWith(spy, 'an-external-id', 'a-service-id')
    })
  })
})

function getAgreementsService(stub = {}) {
  return proxyquire('./agreements.service.js', { './../../services/clients/ledger.client': stub })
}