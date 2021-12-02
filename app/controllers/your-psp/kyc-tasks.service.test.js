'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

describe('KYC additional tasks', () => {
  let listPersonsMock, retrieveAccountDetailsMock
  const gatewayAccountCredential = {
    stripe_account_id: 'test',
    payment_provider: 'stripe'
  }

  describe('Organisation URL', () => {
    it('task should be marked complete if URL is set on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve())
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve({ business_profile: { url: 'http://some-url' } }))

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList({ gatewayAccountCredential })

      expect(taskList.ENTER_ORGANISATION_URL.complete).to.equal(true)
    })

    it('task should not be marked complete if URL is not set on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve())
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve({ business_profile: { url: null } }))

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.ENTER_ORGANISATION_URL.complete).to.equal(false)
    })
  })

  describe('Responsible person', () => {
    it('task should be marked complete if responsible person details updated for stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: [{
          id: 'person-1',
          phone: '0000000',
          email: 'test@example.org',
          relationship: {
            representative: true
          }
        }]
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.UPDATE_RESPONSIBLE_PERSON.complete).to.equal(true)
    })

    it('task should not be marked complete if no persons set on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: []
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.UPDATE_RESPONSIBLE_PERSON.complete).to.equal(false)
    })

    it('task should not be marked complete if responsible person is not on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: [{
          id: 'person-1',
          relationship: {
            representative: false,
            director: true
          }
        }]
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.UPDATE_RESPONSIBLE_PERSON.complete).to.equal(false)
    })
  })

  describe('Director', () => {
    it('task should be marked complete if director has been provided for stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: [{
          id: 'person-1',
          relationship: {
            director: true
          }
        }]
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.ENTER_DIRECTOR.complete).to.equal(true)
    })

    it('task should not be marked complete if no persons set on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: []
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.ENTER_DIRECTOR.complete).to.equal(false)
    })

    it('task should not be marked complete if director is not on stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve({
        data: [{
          id: 'person-1',
          relationship: {
            representative: true,
            director: false
          }
        }]
      }))
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.ENTER_DIRECTOR.complete).to.equal(false)
    })
  })

  describe('Government entity document', () => {
    it('task should be marked complete if entity verification document has been provided for stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve())
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve({ company: { verification: { document: { front: 'file_id_123' } } } }))

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.complete).to.equal(true)
    })

    it('task should not be marked complete if document has not been updated for stripe account', async () => {
      listPersonsMock = sinon.spy(() => Promise.resolve())
      retrieveAccountDetailsMock = sinon.spy(() => Promise.resolve())

      const kycTasksService = getServiceWithMocks()
      const taskList = await kycTasksService.getTaskList(gatewayAccountCredential)

      expect(taskList.UPLOAD_GOVERNMENT_ENTITY_DOCUMENT.complete).to.equal(false)
    })
  })

  describe('Tasks completeness', () => {
    it('isComplete should return true if all tasks are complete', async () => {
      const kycTasksService = getServiceWithMocks()
      const complete = await kycTasksService.isComplete({
        ENTER_ORGANISATION_URL: { complete: true },
        UPDATE_RESPONSIBLE_PERSON: { complete: true },
        ENTER_DIRECTOR: { complete: true },
        UPLOAD_GOVERNMENT_ENTITY_DOCUMENT: { complete: true }
      }
      )
      expect(complete).to.equal(true)
    })

    it('isComplete should return false if any task is not marked complete', async () => {
      const kycTasksService = getServiceWithMocks()
      const complete = await kycTasksService.isComplete({
        ENTER_ORGANISATION_URL: { complete: false },
        UPDATE_RESPONSIBLE_PERSON: { complete: false },
        ENTER_DIRECTOR: { complete: true },
        UPLOAD_GOVERNMENT_ENTITY_DOCUMENT: { complete: false }
      }
      )
      expect(complete).to.equal(false)
    })
  })

  function getServiceWithMocks () {
    return proxyquire('./kyc-tasks.service', {
      '../../services/clients/stripe/stripe.client': {
        listPersons: listPersonsMock,
        retrieveAccountDetails: retrieveAccountDetailsMock
      }
    })
  }
})
