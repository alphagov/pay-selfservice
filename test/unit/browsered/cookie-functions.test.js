/* eslint no-global-assign: "off" */

const cookieFunctions = require('../../../app/browsered/cookie-functions')
const jsdom = require('jsdom')

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
      expect(cookieFunctions.getCookie('_ga')).toBeNull()
    })

    it('should return cookie if present', () => {
      document.cookie = '_ga=foo;expires=Thu, 01 Jan 3000 00:00:00 UTC;_test=test1'
      expect(cookieFunctions.getCookie('_ga')).toBe('foo')
    })
    it('should return null if cookie expired', () => {
      document.cookie = '_ga=foo;expires=Thu, 01 Jan 1970 00:00:00 UTC'
      expect(cookieFunctions.getCookie('_ga')).toBeNull()
    })
  })
  describe('setCookieConsent', () => {
    it('should set consent cookie correctly', () => {
      cookieFunctions.setConsentCookie({ 'analytics': true })
      let analyticsCookie = JSON.parse(cookieFunctions.getCookie('govuk_pay_cookie_policy'))
      expect(analyticsCookie.analytics).toBe(true)
    })

    it(
      'should update existing analytics and delete analytics cookies if not consented',
      () => {
        document.cookie = 'govuk_pay_cookie_policy={"analytics":true};domain=.example.org'
        document.cookie = '_ga=ga1;domain=.example.org'
        document.cookie = '_gid=gid1;domain=.example.org'
        document.cookie = '_gat_govuk_shared=shared;domain=.example.org'
        cookieFunctions.setConsentCookie({ 'analytics': false })

        let analyticsCookie = JSON.parse(cookieFunctions.getCookie('govuk_pay_cookie_policy'))
        expect(analyticsCookie.analytics).toBe(false)
        expect(cookieFunctions.getCookie('_ga')).toBeNull()
        expect(cookieFunctions.getCookie('_gid')).toBeNull()
        expect(cookieFunctions.getCookie('_gat_govuk_shared')).toBeNull()
      }
    )
  })
  describe('setConsent', () => {
    it('should not set cookie if cookie name is not known', () => {
      cookieFunctions.setCookie('unknownCookie', 'value')
      expect(cookieFunctions.getCookie('unknownCookie')).toBeNull()
    })
    it('should set cookie when no options are provided', () => {
      cookieFunctions.setCookie('govuk_pay_cookie_policy', 'test')
      expect(cookieFunctions.getCookie('govuk_pay_cookie_policy')).toBe('test')
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

      expect(expiryDate.getTime()).toBeGreaterThan(previousDateToTargetExpiryDate.getTime())
      expect(expiryDate.getTime()).toBeLessThan(nextDateToTargetExpiryDate.getTime())
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
      expect(cookieFunctions.getCookieDomain()).toBe('.example.org')
    })
    it(`should remove selfservice when www is not present in hostname`, () => {
      window = new jsdom.JSDOM('', {
        url: 'http://selfservice.example.org/search?from_date=2020-01-01'
      }).window
      expect(cookieFunctions.getCookieDomain()).toBe('.example.org')
    })
  })
})
