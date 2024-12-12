const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const { postAcceptedCardsForServiceAndAccountType } = require('@services/card-types.service')
const paths = require('@root/paths')

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

const viewOnlyUser = new User(userFixtures.validUserResponse(
  {
    external_id: 'user-id-for-view-only-user',
    service_roles: {
      service:
        {
          service: { external_id: SERVICE_ID },
          role: { name: 'view-only' }
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
const mockPostAcceptedCardsForServiceAndAccountType = sinon.stub().resolves({})

const { res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/card-types/card-types.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-types.service': {
      getAllCardTypes: mockGetAllCardTypes,
      getAcceptedCardTypesForServiceAndAccountType: mockGetAcceptedCardTypesForServiceAndAccountType,
      postAcceptedCardsForServiceAndAccountType: mockPostAcceptedCardsForServiceAndAccountType
    }
  })
  .build()

describe('Controller: settings/card-types', () => {
  describe('get for admin user', () => {
    before(() => {
      nextRequest({
        user: adminUser
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(adminUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('debitCards').length(1)
      expect(mockResponse.args[0][3].cardTypes.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: true })
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('creditCards').length(1)
      expect(mockResponse.args[0][3].cardTypes.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: false })
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('currentAcceptedCardTypeIds').length(1)
    })
  })

  describe('get for non-admin user', () => {
    before(() => {
      nextRequest({
        user: viewOnlyUser
      })
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(viewOnlyUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('Enabled debit cards').to.have.length(1).to.include('Visa debit')
      expect(mockResponse.args[0][3].cardTypes).to.have.property('Not enabled debit cards').to.have.length(0)
      expect(mockResponse.args[0][3].cardTypes).to.have.property('Enabled credit cards').to.have.length(0)
      expect(mockResponse.args[0][3].cardTypes).to.have.property('Not enabled credit cards').to.have.length(1).to.include('Visa credit')
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(false)
      expect(mockResponse.args[0][3]).to.have.property('currentAcceptedCardTypeIds').length(1)
    })
  })

  describe('post to enable an additional card type', () => {
    before(() => {
      nextRequest({
        user: adminUser,
        body: { currentAcceptedCardTypeIds: 'id-001', credit: ['id-001', 'id-002'] },
        flash: sinon.stub()
      })
      call('post')
    })

    it('should call adminusers to update accepted card types', () => {
      expect(mockPostAcceptedCardsForServiceAndAccountType.called).to.be.true // eslint-disable-line
    })

    it('should redirect to same page', () => {
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.cardTypes.index)
    })
