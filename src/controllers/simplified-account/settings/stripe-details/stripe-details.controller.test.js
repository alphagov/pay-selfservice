const sinon = require('sinon')
const { expect } = require('chai')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { COMPLETED_CANNOT_START, NOT_STARTED, CANNOT_START } = require('@models/constants/task-status')
const StripeAccountSetup = require('@models/StripeAccountSetup.class')
const { buildGetStripeAccountSetupResponse } = require('@test/fixtures/stripe-account-setup.fixtures')
const GatewayAccountCredential = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const CredentialState = require('@models/constants/credential-state')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()
const mockStripeDetailsService = {
  getStripeAccountOnboardingDetails: sinon.stub().resolves({
    foo: 'bar',
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
  describe('getAccountDetails', () => {
    describe('when requesting account details', () => {
      before(() => {
        call('getAccountDetails')
      })
      it('should return a json object', () => {
        sinon.assert.calledOnce(mockStripeDetailsService.getStripeAccountOnboardingDetails)
        sinon.assert.calledWith(mockStripeDetailsService.getStripeAccountOnboardingDetails, req.service)
        sinon.assert.calledWith(res.json, {
          foo: 'bar'
        })
      })
    })
  })

  describe('get', () => {
    describe('when there are outstanding tasks', () => {
      before(() => {
        nextRequest({
          gatewayAccountStripeProgress: new StripeAccountSetup(
            buildGetStripeAccountSetupResponse({
              bank_account: true
            })
          )
        })
        call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        expect(mockResponse.args[0][0].gatewayAccountStripeProgress).to.have.property('bankAccount', true)
        expect(mockResponse.args[0][0].gatewayAccountStripeProgress).to.have.property('vatNumber', false)
        expect(mockResponse.args[0][0].gatewayAccountStripeProgress).to.have.property('governmentEntityDocument', false)
        expect(mockResponse.args[0][1]).to.deep.equal(res)
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/stripe-details/index')
      })

      it('should pass context data to the response method', () => {
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
        expect(mockResponse.args[0][3]).to.have.property('serviceExternalId').to.equal(SERVICE_ID)
      })

      it('should pass Stripe details tasks to the response method', () => {
        const stripeDetailsTasks = mockResponse.args[0][3].tasks
        expect(stripeDetailsTasks[0]).to.deep.equal({
          linkText: 'Organisation\'s bank details',
          href: `/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/bank-details`,
          id: 'stripe-bank-details',
          status: COMPLETED_CANNOT_START
        })
        expect(stripeDetailsTasks[3]).to.deep.equal({
          linkText: 'VAT registration number',
          href: `/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/vat-number`,
          id: 'stripe-vat-number',
          status: NOT_STARTED
        })
        expect(stripeDetailsTasks[6]).to.deep.equal({
          linkText: 'Government entity document',
          href: `/service/${SERVICE_ID}/account/${ACCOUNT_TYPE}/settings/stripe-details/government-entity-document`,
          id: 'stripe-gov-entity-doc',
          status: CANNOT_START
        })
      })
    })

    describe('when messages are available', () => {
      before(() => {
        nextRequest({
          gatewayAccountStripeProgress: new StripeAccountSetup(
            buildGetStripeAccountSetupResponse()
          )
        })
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
          gatewayAccountStripeProgress: new StripeAccountSetup(
            buildGetStripeAccountSetupResponse({
              bank_account: true,
              responsible_person: true,
              vat_number: true,
              company_number: true,
              director: true,
              government_entity_document: true,
              organisation_details: true,
            })
          ),
          query: {
            noscript: 'true'
          }
        })
        call('get')
      })
      it('should set incompleteTasks to false', () => {
        expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(false)
      })

      it('should render response with answers', () => {
        const call = mockStripeDetailsService.getStripeAccountOnboardingDetails.getCall(0)
        expect(call).to.not.be.null
        expect(call.args[0]).to.deep.equal(req.service)
        expect(call.args[1]).to.deep.equal(req.account)
        expect(mockResponse.args[0][3]).to.have.property('answers').to.deep.equal({
          foo: 'bar'
        })
      })
    })
    describe('when account is switching providers', () => {
      before(() => {
        nextRequest({
          gatewayAccountStripeProgress: new StripeAccountSetup(
            buildGetStripeAccountSetupResponse({
              bank_account: true,
              responsible_person: true,
              vat_number: true,
              company_number: true,
              director: true,
              government_entity_document: true,
              organisation_details: true,
            })
          ),
          account: {
            providerSwitchEnabled: true,
            getSwitchingCredential: () => new GatewayAccountCredential()
              .withState(CredentialState.CREATED)
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
