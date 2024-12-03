const sinon = require('sinon')
const { expect } = require('chai')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  getStripeAccountOnboardingDetails: sinon.stub().resolves({
    foo: 'bar'
  })
}

const {
  req,
  res,
  nextRequest,
  nextResponse,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/stripe-details/stripe-details.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Controller: settings/stripe-details', () => {
  describe('get', () => {
    describe('when there are outstanding tasks', () => {
      before(() => {
        nextRequest({
          account: {
            connectorGatewayAccountStripeProgress: {
              bankAccount: true,
              vatNumber: false,
              governmentEntityDocument: false
            }
          }
        })
        call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(mockResponse.args[0][0].account.connectorGatewayAccountStripeProgress).to.deep.equal({
          bankAccount: true,
          vatNumber: false,
          governmentEntityDocument: false
        })
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/index')
      })

      it('should pass context data to the response method', () => {
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
        expect(mockResponse.args[0][3]).to.have.property('serviceExternalId').to.equal(SERVICE_ID)
      })

      it('should pass Stripe details tasks to the response method', () => {
        const stripeDetailsTasks = mockResponse.args[0][3].stripeDetailsTasks
        expect(stripeDetailsTasks).to.have.all.keys('bankAccount', 'vatNumber', 'governmentEntityDocument')
        expect(stripeDetailsTasks.bankAccount).to.deep.equal({
          friendlyName: 'Organisation\'s bank details',
          href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/bank-account`,
          status: true
        })
        expect(stripeDetailsTasks.vatNumber).to.deep.equal({
          friendlyName: 'VAT registration number',
          href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/vat-number`,
          status: false
        })
        expect(stripeDetailsTasks.governmentEntityDocument).to.deep.equal({
          friendlyName: 'Government entity document',
          href: `/simplified/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/government-entity-document`,
          status: 'disabled'
        })
      })
    })

    describe('when messages are available', () => {
      before(() => {
        nextResponse({
          locals: {
            flash: {
              messages: 'blah'
            }
          }
        })
        call('get')
      })

      it('should pass messages to the response method', () => {
        expect(mockResponse.args[0][3]).to.have.property('messages').to.equal('blah')
      })
    })

    describe('when all tasks are complete', () => {
      before(() => {
        nextRequest({
          account: {
            connectorGatewayAccountStripeProgress: {
              bankAccount: true,
              vatNumber: true,
              governmentEntityDocument: true
            }
          }
        })
        call('get')
      })
      it('should set incompleteTasks to false', () => {
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(false)
      })

      it('should render response with answers', () => {
        const call = mockStripeDetailsService.getStripeAccountOnboardingDetails.getCall(0)
        expect(call).to.not.be.null // eslint-disable-line
        expect(call.args[0]).to.deep.equal(req.service)
        expect(call.args[1].connectorGatewayAccountStripeProgress).to.deep.equal({
          bankAccount: true,
          vatNumber: true,
          governmentEntityDocument: true
        })
        expect(mockResponse.args[0][3]).to.have.property('answers').to.deep.equal({
          foo: 'bar'
        })
      })
    })
    describe('when account is switching providers', () => {
      before(() => {
        nextRequest({
          account: {
            providerSwitchEnabled: true
          }
        })
        call('get')
      })

      it('should render response with answers', () => {
        expect(mockResponse.args[0][3]).to.have.property('providerSwitchEnabled').to.deep.equal(true)
      })
    })
  })
})
