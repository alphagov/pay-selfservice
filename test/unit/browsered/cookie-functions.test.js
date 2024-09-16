/* eslint no-global-assign: "off" */

const cookieFunctions = require('../../../app/browsered/cookie-functions')
const jsdom = require('jsdom')
const { expect } = require('chai')

describe('Cookie functions', () => {
  beforeEach(() => {
    window = new jsdom.JSDOM('', {
      url: 'http://www.selfservice.example.org/search?from_date=2020-01-01'
    }).window
    document = window.document
    document.cookie = ''
  })

  describe('getCookie', () => {
    it('should return null if no cookie present', () => {
      expect(cookieFunctions.getCookie('_ga')).to.be.equal(null)
    })

    it('should return cookie if present', () => {
      document.cookie = '_ga=foo;expires=Thu, 01 Jan 3000 00:00:00 UTC;_test=test1'
      expect(cookieFunctions.getCookie('_ga')).to.be.equal('foo')
    })
    it('should return null if cookie expired', () => {
      document.cookie = '_ga=foo;expires=Thu, 01 Jan 1970 00:00:00 UTC'
      expect(cookieFunctions.getCookie('_ga')).to.be.equal(null)
    })
  })
  describe('setCookieConsent', () => {
    it('should set consent cookie correctly', () => {
      cookieFunctions.setConsentCookie({ 'analytics': true, 'SameSite': 'Lax' })
      let analyticsCookie = JSON.parse(cookieFunctions.getCookie('govuk_pay_cookie_policy'))
      expect(analyticsCookie.analytics).to.be.equal(true)
      expect(analyticsCookie.SameSite).to.be.equal('Lax')
    })

    it('should update existing analytics and delete analytics cookies if not consented', () => {
      document.cookie = 'govuk_pay_cookie_policy={"analytics":true};domain=.example.org'
      document.cookie = '_ga=ga1;domain=.example.org'
      document.cookie = '_gid=gid1;domain=.example.org'
      document.cookie = '_gat_govuk_shared=shared;domain=.example.org'
      cookieFunctions.setConsentCookie({ 'analytics': false, 'SameSite': 'Lax' })

      let analyticsCookie = JSON.parse(cookieFunctions.getCookie('govuk_pay_cookie_policy'))
      expect(analyticsCookie.analytics).to.be.equal(false)
      expect(analyticsCookie.SameSite).to.be.equal('Lax')
      expect(cookieFunctions.getCookie('_ga')).to.be.equal(null)
      expect(cookieFunctions.getCookie('_gid')).to.be.equal(null)
      expect(cookieFunctions.getCookie('_gat_govuk_shared')).to.be.equal(null)
    })
  })
  describe('setConsent', () => {
    it('should not set cookie if cookie name is not known', () => {
      cookieFunctions.setCookie('unknownCookie', 'value')
      expect(cookieFunctions.getCookie('unknownCookie')).to.be.equal(null)
    })
    it('should set cookie when no options are provided', () => {
      cookieFunctions.setCookie('govuk_pay_cookie_policy', 'test')
      expect(cookieFunctions.getCookie('govuk_pay_cookie_policy')).to.be.equal('test')
    })
    it('should calculate expiry date correctly for given number of days', () => {
      const cookieExpiryDays = 10
      const cookieString = cookieFunctions.setCookie('govuk_pay_cookie_policy',
        '{"analytics":false}', { days: cookieExpiryDays })

      // We cannot check the expiry date exactly - so checking it is between 2 days.
      const searchString = 'expires='
      const expiryDateString = cookieString.substring(
        cookieString.indexOf(searchString) + searchString.length)

      let expiryDate = new Date(expiryDateString)
      let previousDateToTargetExpiryDate = addDaysToDate(cookieExpiryDays - 1)
      let nextDateToTargetExpiryDate = addDaysToDate(cookieExpiryDays + 1)

      expect(expiryDate.getTime()).to.be.greaterThan(previousDateToTargetExpiryDate.getTime())
      expect(expiryDate.getTime()).to.be.lessThan(nextDateToTargetExpiryDate.getTime())
    })

    it('should set SameSite on the cookie', () => {
      const cookieExpiryDays = 10
      const cookieString = cookieFunctions.setCookie('govuk_pay_cookie_policy',
        '{"analytics":false}', { days: cookieExpiryDays })

      expect(cookieString).to.contain('SameSite=Lax')
    })
  })

  function addDaysToDate (cookieExpiryDays) {
    return new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * (cookieExpiryDays))
  }

  describe('getCookieDomain', () => {
    it(`should remove both www and selfservice from hostname`, () => {
      window = new jsdom.JSDOM('', {
        url: 'http://www.selfservice.example.org/search?from_date=2020-01-01'
      }).window
      expect(cookieFunctions.getCookieDomain()).to.be.equal('.example.org')
    })
    it(`should remove selfservice when www is not present in hostname`, () => {
      window = new jsdom.JSDOM('', {
        url: 'http://selfservice.example.org/search?from_date=2020-01-01'
      }).window
      expect(cookieFunctions.getCookieDomain()).to.be.equal('.example.org')
    })
  })
})
