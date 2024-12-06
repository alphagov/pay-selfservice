const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const adminUser = new User(userFixtures.validUserResponse({
  external_id: 'user-id-for-admin-user',
  service_roles: {
    service: {
      service: { external_id: SERVICE_ID },
      role: { name: 'admin' }
    }
  }
}))

const allCardTypes = [{
  id: 'id-001',
  brand: 'visa',
  label: 'Visa',
  type: 'DEBIT',
  requires3ds: false
},
{
  id: 'id-002',
  brand: 'visa',
  label: 'Visa',
  type: 'CREDIT',
  requires3ds: false
}]
const acceptedCardTypes = [allCardTypes[0]]

const mockResponse = sinon.spy()
const mockGetAllCardTypes = sinon.stub().resolves({ card_types: allCardTypes })
const mockGetAcceptedCardTypesForServiceAndAccountType = sinon.stub().resolves({ card_types: acceptedCardTypes })

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/card-types/card-types.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withUser(adminUser)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-types.service': {
      getAllCardTypes: mockGetAllCardTypes,
      getAcceptedCardTypesForServiceAndAccountType: mockGetAcceptedCardTypesForServiceAndAccountType
    }
  })
  .build()

describe('Controller: settings/card-types', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('debitCards').length(1)
      expect(mockResponse.args[0][3].cardTypes.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: true })
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('creditCards').length(1)
      expect(mockResponse.args[0][3].cardTypes.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: false })
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(true)
    })
  })
})
