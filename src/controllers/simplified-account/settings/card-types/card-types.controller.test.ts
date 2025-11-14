import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import { expect } from 'chai'
import User from '@models/user/User.class'
import userFixtures from '@test/fixtures/user.fixtures'
import { ServiceView } from '@models/service-status/ServiceView.class'

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const adminUser = new User(
  userFixtures.validUserResponse({
    external_id: 'user-id-for-admin-user',
    service_roles: {
      service: {
        service: { external_id: SERVICE_EXTERNAL_ID },
        role: { name: 'admin' },
      },
    },
  })
)

const viewOnlyUser = new User(
  userFixtures.validUserResponse({
    external_id: 'user-id-for-view-only-user',
    service_roles: {
      service: {
        service: { external_id: SERVICE_EXTERNAL_ID },
        role: { name: 'view-only' },
      },
    },
  })
)

const allCardTypes = [
  {
    id: 'id-001',
    brand: 'visa',
    label: 'Visa',
    type: 'DEBIT',
    requires3ds: false,
  },
  {
    id: 'id-002',
    brand: 'visa',
    label: 'Visa',
    type: 'CREDIT',
    requires3ds: false,
  },
  {
    id: 'id-003',
    brand: 'amex',
    label: 'American Express',
    type: 'CREDIT',
    requires3ds: false,
  },
]
const acceptedCardTypes = [allCardTypes[0]]

const mockResponse = sinon.stub()
const mockGetAllCardTypes = sinon.stub().resolves(allCardTypes)
const mockGetAcceptedCardTypesForServiceAndAccountType = sinon.stub().resolves(acceptedCardTypes)
const mockPostAcceptedCardsForServiceAndAccountType = sinon.stub().resolves({})

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/card-types/card-types.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withServiceView(ServiceView.Live())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-types.service': {
      getAllCardTypes: mockGetAllCardTypes,
      getAcceptedCardTypes: mockGetAcceptedCardTypesForServiceAndAccountType,
      updateAcceptedCardTypes: mockPostAcceptedCardsForServiceAndAccountType,
    },
  })
  .build()

describe('Controller: settings/card-types', () => {
  describe('get for admin user', () => {
    beforeEach(async () => {
      nextRequest({
        user: adminUser,
      })
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(adminUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('debitCards').length(1)

      expect(mockResponse.args[0][3].cardTypes.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: true })
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('creditCards').length(2)

      expect(mockResponse.args[0][3].cardTypes.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: false })

      expect(mockResponse.args[0][3].cardTypes.creditCards[1]).to.deep.include({
        text: 'American Express',
        checked: false,
      })
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('currentAcceptedCardTypeIds').length(1)
    })
  })

  describe('get for non-admin user', () => {
    beforeEach(async () => {
      nextRequest({
        user: viewOnlyUser,
      })
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0].user).to.deep.equal(viewOnlyUser)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3])
        .to.have.property('cardTypes')
        .to.have.property('debit/enabled')
        .to.have.property('cards')
        .to.deep.equal(['Visa debit'])

      expect(mockResponse.args[0][3].cardTypes)
        .to.have.property('debit/disabled')
        .to.have.property('cards')
        .to.have.length(0)

      expect(mockResponse.args[0][3].cardTypes)
        .to.have.property('credit/enabled')
        .to.have.property('cards')
        .to.have.length(0)

      expect(mockResponse.args[0][3].cardTypes['credit/disabled'].cards).to.deep.equal([
        'Visa credit',
        'American Express',
      ])
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(false)
      expect(mockResponse.args[0][3]).to.have.property('currentAcceptedCardTypeIds').length(1)
    })
  })

  describe('post to enable an additional card type', () => {
    beforeEach(async () => {
      nextRequest({
        user: adminUser,
        body: { currentAcceptedCardTypeIds: 'id-001', debit: 'id-001', credit: ['id-002', 'id-003'] },
      })
      await call('post')
    })

    it('should call adminusers to update accepted card types', () => {
      expect(mockPostAcceptedCardsForServiceAndAccountType.called).to.be.true
    })

    it('should redirect to same page with success notification', () => {
      expect(req.flash).to.have.been.calledWith('messages', {
        state: 'success',
        icon: '&check;',
        heading: 'Accepted card types have been updated',
      })
      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.cardTypes.index)
    })
  })

  describe('post an unchanged set of card types', () => {
    beforeEach(async () => {
      nextRequest({
        user: adminUser,
        body: { currentAcceptedCardTypeIds: 'id-001', debit: 'id-001' },
      })
      await call('post')
    })

    it('should not call adminusers', () => {
      expect(mockPostAcceptedCardsForServiceAndAccountType.called).to.be.false
    })

    it('should redirect to same page without a notification', () => {
      expect(req.flash).to.have.been.not.called
      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.cardTypes.index)
    })
  })

  describe('post with no card types selected', () => {
    beforeEach(async () => {
      nextRequest({
        user: adminUser,
        body: { currentAcceptedCardTypeIds: 'id-001' },
      })
      await call('post')
    })

    it('should not call adminusers', () => {
      expect(mockPostAcceptedCardsForServiceAndAccountType.called).to.be.false
    })

    it('should should pass context data to the response method with an error', () => {
      expect(mockResponse.args[0][3])
        .to.have.property('errors')
        .to.deep.include({ summary: [{ text: 'You must choose at least one card', href: '#' }] })
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('debitCards').length(1)

      expect(mockResponse.args[0][3].cardTypes.debitCards[0]).to.deep.include({ text: 'Visa debit', checked: false })
      expect(mockResponse.args[0][3]).to.have.property('cardTypes').to.have.property('creditCards').length(2)

      expect(mockResponse.args[0][3].cardTypes.creditCards[0]).to.deep.include({ text: 'Visa credit', checked: false })

      expect(mockResponse.args[0][3].cardTypes.creditCards[1]).to.deep.include({
        text: 'American Express',
        checked: false,
      })
      expect(mockResponse.args[0][3]).to.have.property('isAdminUser').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('currentAcceptedCardTypeIds').length(1)
    })
  })
})
