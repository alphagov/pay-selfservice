'use strict'

const supertest = require('supertest')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')
const sinon = require('sinon')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')

const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

jest.mock('../../utils/response', () => ({
  response: mockResponse
}));

const getController = (mockResponse) => {
  return require('../../../../app/controllers/payment-links/get-information.controller');
}

describe('Create payment link information controller', () => {
  describe('if landing here for the first time', () => {
    let result, $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.information)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).toBe(200)
    })

    it(
      'should include a cancel link linking to the Create payment link index',
      () => {
        expect($('.cancel').attr('href')).toBe(paths.paymentLinks.start)
      }
    )

    it('should have itself as the form action', () => {
      expect($('form').attr('action')).toBe(paths.paymentLinks.information)
    })

    it('should have blank value in the Title input', () =>
      expect($('input[name="payment-link-title"]').val()).toBeUndefined())

    it('should have blank value in the Details textarea', () =>
      expect($('textarea[name="payment-link-description"]').val()).toBe(''))
  })

  describe('when returning to the page with validation errors', () => {
    const titleError = 'Something wrong with the title'
    let $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      lodash.set(session, 'pageData.createPaymentLink.informationPageRecovered', {
        title: 'Title',
        description: 'Hello world',
        errors: {
          title: titleError
        }
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.information)
        .end((err, res) => {
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should set the value of the Title input to recovered value', () =>
      expect($('input[name="payment-link-title"]').val()).toBe('Title'))

    it('should set the value of the Details textarea to recovered value', () =>
      expect($('textarea[name="payment-link-description"]').val()).toBe('Hello world'))

    it('should show an error summary', () => {
      expect($('.govuk-error-summary__list li').length).toBe(1)
      expect($('.govuk-error-summary__list li a[href$="#payment-link-title"]').text()).toBe(titleError)
    })

    it('should show inline errors', () => {
      expect($('.govuk-error-message').length).toBe(1)
    })
  })

  describe('if returning here to change fields', () => {
    let $, session
    beforeAll(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Pay for an offline service',
        paymentLinkDescription: 'Hello world'
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.information)
        .end((err, res) => {
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it(
      'should pre-set the value of the Title input to pre-existing data if present in the session',
      () =>
        expect($('input[name="payment-link-title"]').val()).toBe(session.pageData.createPaymentLink.paymentLinkTitle)
    )

    it(
      'should pre-set the value of the Details textarea to pre-existing data if present in the session',
      () =>
        expect($('textarea[name="payment-link-description"]').val()).toBe(session.pageData.createPaymentLink.paymentLinkDescription)
    )
  })

  describe('service name resolution', () => {
    it(
      'should resolve the English service name when creating an English payment link',
      () => {
        const req = {
          service: {
            serviceName: {
              en: 'English name',
              cy: 'Welsh name'
            }
          },
          body: {}
        }

        const mockResponse = sinon.stub()
        const controller = getController(mockResponse)
        controller(req, {})
        expect(mockResponse.getCall(0).args[3].serviceName).toBe(req.service.serviceName.en)
      }
    )

    it(
      'should resolve the Welsh service name when creating a Welsh payment link and there is a Welsh service name',
      () => {
        const req = {
          service: {
            serviceName: {
              en: 'English name',
              cy: 'Welsh name'
            }
          },
          query: {
            language: 'cy'
          },
          body: {}
        }

        const mockResponse = sinon.stub()
        const controller = getController(mockResponse)
        controller(req, {})
        expect(mockResponse.getCall(0).args[3].serviceName).toBe(req.service.serviceName.cy)
      }
    )

    it(
      'should resolve the English service name when creating a Welsh payment link and there is NOT a Welsh service name',
      () => {
        const req = {
          service: {
            serviceName: {
              en: 'English name'
            }
          },
          query: {
            language: 'cy'
          },
          body: {}
        }

        const mockResponse = sinon.stub()
        const controller = getController(mockResponse)
        controller(req, {})
        expect(mockResponse.getCall(0).args[3].serviceName).toBe(req.service.serviceName.en)
      }
    )
  })
})
