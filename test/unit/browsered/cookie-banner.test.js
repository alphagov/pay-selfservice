/* eslint no-global-assign: "off" */
/* eslint no-undef: "off" */
/* eslint no-unused-expressions: "off" */

const cookieBanner = require('../../../app/browsered/cookie-banner')
const analytics = require('../../../app/browsered/analytics')
const sinon = require('sinon')
const jsdom = require('jsdom')
const { expect } = require('chai')
let renderTemplate = require('../../test-helpers/html-assertions.js').render

let event
let cookieBannerObject
const analyticsInit = sinon.stub(analytics, 'init')

describe('Cookie banner', () => {
  beforeEach(() => {
    const body = renderTemplate('includes/cookie-message', {})
    window = new jsdom.JSDOM(body, {
      url: 'https://example.org/search?from_date=2020-01-01'
    }).window
    document = window.document
    document.cookie = ''

    analyticsTrackingId = ''
    analyticsInit.resetHistory()

    cookieBannerObject = cookieBanner.initCookieBanner()
  })

  it('should set the cookie banner display style to block on init', () => {
    expect(cookieBannerObject.$module.style.display).to.be.equal('block')
  })

  it('should set the cookie banner display style to none on hide ', () => {
    event = sinon.mock()
    cookieBannerObject.hideCookieMessage(event)
    expect(cookieBannerObject.$module.style.display).to.be.equal('none')
  })

  it('should initialise analytics if consented and analyticsTrackingId is configured ', () => {
    analyticsTrackingId = 'test-id'
    cookieBannerObject.setCookieConsent(true)

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
    expect(document.body.innerHTML).to.contain('You’ve accepted analytics cookies.')

    expect(analyticsInit.calledOnce).to.be.true
  })
  it('should not initialise analytics if consented and analyticsTrackingId is not configured ', () => {
    cookieBannerObject.setCookieConsent(true)

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
    expect(document.body.innerHTML).to.contain('You’ve accepted analytics cookies.')
    expect(analyticsInit.calledOnce).to.be.false
  })

  it('should not initialise analytics if not consented ', () => {
    cookieBannerObject.setCookieConsent(false)

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":false,"SameSite":"Lax"}')
    expect(document.body.innerHTML).to.contain('You told us not to use analytics cookies.')

    expect(analyticsInit.calledOnce).to.be.false
  })

  it('should not display cookie banner and initialise analytics if previously consented ', () => {
    // set consent cookie before initialising cookie banner
    cookieBannerObject.setCookieConsent(true)
    analyticsTrackingId = 'test'

    cookieBannerObject = cookieBanner.initCookieBanner()

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
    expect(cookieBannerObject.$module.style.display).to.be.equal('none')

    expect(analyticsInit.calledOnce).to.be.true
  })

  it('should not display cookie banner and not initialise analytics if not previously consented ', () => {
    // set consent cookie before initialising cookie banner
    cookieBannerObject.setCookieConsent(false)

    cookieBannerObject = cookieBanner.initCookieBanner()

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":false,"SameSite":"Lax"}')
    expect(cookieBannerObject.$module.style.display).to.be.equal('none')

    expect(analyticsInit.notCalled).to.be.true
  })

  it('should not display cookie banner and not initialise analytics if previously consented but analytics ID is not configured', () => {
    // set consent cookie before initialising cookie banner
    cookieBannerObject.setCookieConsent(true)
    analyticsTrackingId = ''

    cookieBannerObject = cookieBanner.initCookieBanner()

    expect(document.cookie).equals('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
    expect(cookieBannerObject.$module.style.display).to.be.equal('none')

    expect(analyticsInit.notCalled).to.be.true
  })
})
