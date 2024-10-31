const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

let req, res, responseStub, stripeDetailsController

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const getController = (stubs = {}) => {
  return proxyquire('./stripe-details.controller', {
    '../../../../utils/response': { response: stubs.response }
  })
}

const setupTest = (method, additionalReqProps = {}, additionalResProps = {}) => {
  responseStub = sinon.spy()
  stripeDetailsController = getController({
    response: responseStub
  })
  req = {
    service: {
      externalId: SERVICE_ID
    },
    ...additionalReqProps
  }
  res = {
    redirect: sinon.spy(),
    ...additionalResProps
  }
  stripeDetailsController[method](req, res)
}

describe('Controller: settings/stripe-details', () => {
  describe('get', () => {
    before(() => setupTest('get', {
      account: {
        type: ACCOUNT_TYPE,
        connectorGatewayAccountStripeProgress: {
          bankAccount: true,
          vatNumber: false,
          governmentEntityDocument: false
        }
      }
    }))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/stripe-details/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
      expect(responseStub.args[0][3]).to.have.property('serviceId').to.equal(SERVICE_ID)
    })

    it('should pass Stripe details tasks to the response method', () => {
      const stripeDetailsTasks = responseStub.args[0][3].stripeDetailsTasks
      expect(stripeDetailsTasks).to.have.all.keys('Organisation\'s bank details', 'Government entity document', 'VAT registration number')
      expect(stripeDetailsTasks['Organisation\'s bank details']).to.deep.equal({
        href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/bank-account`,
        status: true,
        id: 'bankAccount'
      })
      expect(stripeDetailsTasks['VAT registration number']).to.deep.equal({
        href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/vat-number`,
        status: false,
        id: 'vatNumber'
      })
      expect(stripeDetailsTasks['Government entity document']).to.deep.equal({
        href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/government-entity-document`,
        status: 'disabled',
        id: 'governmentEntityDocument'
      })
    })

    describe('when messages are available', () => {
      before(() => setupTest('get',
        {
          account: {
            type: ACCOUNT_TYPE
          }
        },
        {
          locals: {
            flash: {
              messages: 'blah'
            }
          }
        }
      ))
      it('should pass messages to the response method', () => {
        expect(responseStub.args[0][3]).to.have.property('messages').to.equal('blah')
      })
    })

    describe('when all tasks are complete', () => {
      before(() => setupTest('get', {
        account: {
          type: ACCOUNT_TYPE,
          connectorGatewayAccountStripeProgress: {
            bankAccount: true,
            vatNumber: true,
            governmentEntityDocument: true
          }
        }
      }))
      it('should set incompleteTasks to false', () => {
        expect(responseStub.args[0][3]).to.have.property('incompleteTasks').to.equal(false)
      })
    })
  })
})
