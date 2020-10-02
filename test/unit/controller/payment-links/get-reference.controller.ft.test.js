'use strict'

const supertest = require('supertest')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Create payment link reference controller', () => {
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
      lodash.set(session, 'pageData.createPaymentLink', {
        isWelsh: false
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.reference)
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
      expect($('form').attr('action')).toBe(paths.paymentLinks.reference)
    })

    it('should have no checked radio buttons', () =>
      expect($('input[type="radio"]:checked').length).toBe(0))

    it('should have blank value in the reference input', () =>
      expect($('input[name="reference-label"]').val()).toBeUndefined())

    it('should have blank value in the reference hint text input', () =>
      expect($('input[name="reference-hint-text"]').val()).toBeUndefined())
  })

  describe('when returning to the page with validation errors', () => {
    const label = 'Hello world'
    const hint = 'Some words'
    const typeError = 'Something wrong with the type'
    const labelError = 'Something wrong with the label'
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
      lodash.set(session, 'pageData.createPaymentLink.referencePageRecovered', {
        type: 'custom',
        label,
        hint,
        errors: {
          type: typeError,
          label: labelError
        }
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.reference)
        .end((err, res) => {
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should set the custom reference radio to checked', () =>
      expect($('#reference-type-custom:checked').length).toBe(1))

    it(
      'should set the value of the reference to pre-existing data present in the session',
      () =>
        expect($('input[name="reference-label"]').val()).toBe(label)
    )

    it(
      'should set the value of the reference hint to pre-existing data present in the session',
      () =>
        expect($('textarea[name="reference-hint-text"]').val()).toBe(hint)
    )

    it('should show an error summary', () => {
      expect($('.govuk-error-summary__list li').length).toBe(2)
      expect($('.govuk-error-summary__list li a[href$="#reference-type-custom"]').text()).toBe(typeError)
      expect($('.govuk-error-summary__list li a[href$="#reference-label"]').text()).toBe(labelError)
    })

    it('should show inline errors', () => {
      expect($('.govuk-error-message').length).toBe(2)
    })
  })

  describe('if returning here to change fields', () => {
    describe('where a custom reference was set', () => {
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
          paymentReferenceType: 'custom',
          paymentReferenceLabel: 'Hello world',
          paymentReferenceHint: 'Some words',
          isWelsh: false
        })
        supertest(createAppWithSession(getApp(), session))
          .get(paths.paymentLinks.reference)
          .end((err, res) => {
            $ = cheerio.load(res.text)
            done(err)
          })
      })
      afterAll(() => {
        nock.cleanAll()
      })

      it('should set the custom reference radio to checked', () =>
        expect($('#reference-type-custom:checked').length).toBe(1))

      it('should set the value of the reference to recovered value', () =>
        expect($('input[name="reference-label"]').val()).toBe(session.pageData.createPaymentLink.paymentReferenceLabel))

      it('should set the value of the reference hint to recovered value', () =>
        expect($('textarea[name="reference-hint-text"]').val()).toBe(session.pageData.createPaymentLink.paymentReferenceHint))
    })

    describe('where the standard reference is used', () => {
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
          paymentReferenceType: 'standard',
          paymentReferenceLabel: '',
          paymentReferenceHint: '',
          isWelsh: false
        })
        supertest(createAppWithSession(getApp(), session))
          .get(paths.paymentLinks.reference)
          .end((err, res) => {
            $ = cheerio.load(res.text)
            done(err)
          })
      })
      afterAll(() => {
        nock.cleanAll()
      })

      it('should set the standard reference radio to checked', () =>
        expect($('#reference-type-standard:checked').length).toBe(1))

      it('should set the value of the reference to blank', () =>
        expect($('input[name="reference-label"]').val()).toBeUndefined())

      it('should set the value of the reference hint to blank', () =>
        expect($('input[name="reference-hint-text"]').val()).toBeUndefined())
    })
  })
})
