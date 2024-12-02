const sinon = require('sinon')
const { expect } = require('chai')
const User = require('@models/User.class')
const userFixtures = require('@test/fixtures/user.fixtures')
const proxyquire = require('proxyquire')

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

let req, res, responseStub, getAllCardTypesStub, getAcceptedCardTypesForServiceAndAccountTypeStub, cardTypesController

const getController = (stubs = {}) => {
  return proxyquire('./card-types.controller', {
    '@utils/response': { response: stubs.response },
    '@services/card-types.service': {
      getAllCardTypes: stubs.getAllCardTypes,
      getAcceptedCardTypesForServiceAndAccountType: stubs.getAcceptedCardTypesForServiceAndAccountType
    }
  })
}

const setupTest = (method, user, additionalReqProps = {}, additionalStubs = {}) => {
  responseStub = sinon.spy()
  getAllCardTypesStub = sinon.stub().returns({ card_types: allCardTypes })
  getAcceptedCardTypesForServiceAndAccountTypeStub = sinon.stub().resolves({ card_types: [allCardTypes[0]] })

  cardTypesController = getController({
    response: responseStub,
    getAllCardTypes: getAllCardTypesStub,
    getAcceptedCardTypesForServiceAndAccountType: getAcceptedCardTypesForServiceAndAccountTypeStub,
    ...additionalStubs
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    user: user,
    service: {
      externalId: SERVICE_ID
    },
    account: {
      type: ACCOUNT_TYPE
    },
    ...additionalReqProps
  }
  cardTypesController[method](req, res)
}

describe('Controller: settings/card-types', () => {
  describe('get for admin user', () => {
    before(() => setupTest('get', adminUser))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0][0]).to.deep.equal(req)
      expect(responseStub.args[0][1]).to.deep.equal(res)
      expect(responseStub.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('cardTypes').to.have.property('debitCards').length(1)
      expect(responseStub.args[0][3].cardTypes.debitCards[0]).to.have.property('text').to.equal('Visa debit')
      expect(responseStub.args[0][3].cardTypes.debitCards[0]).to.have.property('checked').to.equal(true)
      expect(responseStub.args[0][3]).to.have.property('cardTypes').to.have.property('creditCards').length(1)
      expect(responseStub.args[0][3].cardTypes.creditCards[0]).to.have.property('text').to.equal('Visa credit')
      expect(responseStub.args[0][3].cardTypes.creditCards[0]).to.have.property('checked').to.equal(false)
      expect(responseStub.args[0][3]).to.have.property('isAdminUser').to.equal(true)
    })
  })

  describe('get for non-admin user', () => {
    before(() => setupTest('get', viewOnlyUser))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0][0]).to.deep.equal(req)
      expect(responseStub.args[0][1]).to.deep.equal(res)
      expect(responseStub.args[0][2]).to.equal('simplified-account/settings/card-types/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('cardTypes').to.have.property('Enabled debit cards').to.have.length(1).to.include('Visa debit')
      expect(responseStub.args[0][3].cardTypes).to.have.property('Not enabled debit cards').to.have.length(0)
      expect(responseStub.args[0][3].cardTypes).to.have.property('Enabled credit cards').to.have.length(0)
      expect(responseStub.args[0][3].cardTypes).to.have.property('Not enabled credit cards').to.have.length(1).to.include('Visa credit')
      expect(responseStub.args[0][3]).to.have.property('isAdminUser').to.equal(false)
    })
  })
})
