const { expect } = require('chai')
const { getCurrentCredential } = require('../../utils/credentials')
const { getStripeTaskList, stripeTaskListIsComplete } = require('./your-psp-tasks.service')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Stripe task list', () => {
  describe('Get Stripe task list status', () => {
    it('should calculate Stripe status (enabled & completed) correctly for each task when completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: true,
        director: true,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: true
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)

      expect(taskList.ENTER_BANK_DETAILS.enabled).to.equal(false)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.enabled).to.equal(false)
      expect(taskList.ENTER_DIRECTOR.enabled).to.equal(false)
      expect(taskList.ENTER_VAT_NUMBER.enabled).to.equal(false)
      expect(taskList.ENTER_COMPANY_NUMBER.enabled).to.equal(false)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.enabled).to.equal(false)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.enabled).to.equal(false)

      expect(taskList.ENTER_BANK_DETAILS.completed).to.equal(true)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.completed).to.equal(true)
      expect(taskList.ENTER_DIRECTOR.completed).to.equal(true)
      expect(taskList.ENTER_VAT_NUMBER.completed).to.equal(true)
      expect(taskList.ENTER_COMPANY_NUMBER.completed).to.equal(true)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.completed).to.equal(true)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.completed).to.equal(true)
    })

    it('should calculate Stripe status (enabled & completed) correctly for each task when not completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: false,
        director: false,
        vatNumber: false,
        companyNumber: false,
        responsiblePerson: false,
        organisationDetails: false,
        governmentEntityDocument: false
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)

      expect(taskList.ENTER_BANK_DETAILS.enabled).to.equal(true)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.enabled).to.equal(true)
      expect(taskList.ENTER_DIRECTOR.enabled).to.equal(true)
      expect(taskList.ENTER_VAT_NUMBER.enabled).to.equal(true)
      expect(taskList.ENTER_COMPANY_NUMBER.enabled).to.equal(true)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.enabled).to.equal(true)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.enabled).to.equal(false)

      expect(taskList.ENTER_BANK_DETAILS.completed).to.equal(false)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.completed).to.equal(false)
      expect(taskList.ENTER_DIRECTOR.completed).to.equal(false)
      expect(taskList.ENTER_VAT_NUMBER.completed).to.equal(false)
      expect(taskList.ENTER_COMPANY_NUMBER.completed).to.equal(false)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.completed).to.equal(false)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.completed).to.equal(false)
    })

    it('should return upload government document as enabled only when all the other tasks are completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: true,
        director: true,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: false
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)

      expect(taskList.ENTER_BANK_DETAILS.completed).to.equal(true)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.completed).to.equal(true)
      expect(taskList.ENTER_DIRECTOR.completed).to.equal(true)
      expect(taskList.ENTER_VAT_NUMBER.completed).to.equal(true)
      expect(taskList.ENTER_COMPANY_NUMBER.completed).to.equal(true)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.completed).to.equal(true)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.completed).to.equal(false)

      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.enabled).to.equal(true)
    })

    it('should return upload government document as NOT enabled when any other tasks is not completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: true,
        director: false,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: false
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)

      expect(taskList.ENTER_BANK_DETAILS.completed).to.equal(true)
      expect(taskList.ENTER_RESPONSIBLE_PERSON.completed).to.equal(true)
      expect(taskList.ENTER_DIRECTOR.completed).to.equal(false)
      expect(taskList.ENTER_VAT_NUMBER.completed).to.equal(true)
      expect(taskList.ENTER_COMPANY_NUMBER.completed).to.equal(true)
      expect(taskList.CONFIRM_ORGANISATION_DETAILS.completed).to.equal(true)
      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.completed).to.equal(false)

      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.enabled).to.equal(false)
    })

    it('should throw error if payment provider is not Stripe', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'worldpay', id: 100 }
        ]
      })
      expect(function () {
        getStripeTaskList(account)
      }).to.throw('Unsupported payment provider')
    })
  })
  describe('Calculate Stripe tasks completeness', () => {

    it('should return true if all tasks are completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: true,
        director: true,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: true
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)
      expect(stripeTaskListIsComplete(taskList)).to.equal(true)
    })

    it('should return false if none of the tasks are completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: false,
        director: false,
        vatNumber: false,
        companyNumber: false,
        responsiblePerson: false,
        organisationDetails: false,
        governmentEntityDocument: false
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)
      expect(stripeTaskListIsComplete(taskList)).to.equal(false)
    })

    it('should return false if any task is not completed', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 }
        ]
      })
      account.connectorGatewayAccountStripeProgress = {
        bankAccount: false,
        director: true,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: true
      }
      const activeCredential = getCurrentCredential(account)
      const taskList = getStripeTaskList(activeCredential, account)
      expect(stripeTaskListIsComplete(taskList)).to.equal(false)
    })
  })
})
