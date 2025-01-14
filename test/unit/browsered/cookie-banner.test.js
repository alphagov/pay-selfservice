// Commented out temporarily - PP-13452
// /* eslint no-global-assign: "off" */
// /* eslint no-undef: "off" */
// /* eslint no-unused-expressions: "off" */
//
// const { JSDOM } = require('jsdom')
// const { expect } = require('chai')
// const sinon = require('sinon')
// const { render } = require('../../test-helpers/html-assertions.js')
// const initCookieBanner = require('../../../src/client-side/cookie-banner').default
// const setupAnalytics = require('../../../src/client-side/analytics').default
//
// describe('Cookie banner', () => {
//   let cookieBannerObject
//   let window
//   let document
//   const analyticsStub = sinon.stub(setupAnalytics)
//
//   beforeEach(() => {
//     // Setup DOM environment
//     const body = render('includes/cookie-message', {})
//     const dom = new JSDOM(body, {
//       url: 'https://example.org/search?from_date=2020-01-01'
//     })
//
//     window = dom.window
//     document = window.document
//     document.cookie = ''
//
//     // Reset analytics tracking
//     window.analyticsTrackingId = ''
//     analyticsStub.reset()
//
//     // Initialize cookie banner
//     cookieBannerObject = initCookieBanner()
//   })
//
//   afterEach(() => {
//     analyticsStub.reset()
//   })
//
//   after(() => {
//     analyticsStub.restore()
//   })
//
//   it('should set the cookie banner display style to block on init', () => {
//     expect(cookieBannerObject.$module.style.display).to.be.equal('block')
//   })
//
//   it('should set the cookie banner display style to none on hide', () => {
//     const event = sinon.stub()
//     cookieBannerObject.hideCookieMessage(event)
//     expect(cookieBannerObject.$module.style.display).to.be.equal('none')
//   })
//
//   it('should initialise analytics if consented and analyticsTrackingId is configured', () => {
//     window.analyticsTrackingId = 'test-id'
//     cookieBannerObject.setCookieConsent(true)
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
//     expect(document.body.innerHTML).to.contain('You\'ve accepted analytics cookies.')
//     expect(analyticsStub.calledOnce).to.be.true
//   })
//
//   it('should not initialise analytics if consented and analyticsTrackingId is not configured', () => {
//     cookieBannerObject.setCookieConsent(true)
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
//     expect(document.body.innerHTML).to.contain('You\'ve accepted analytics cookies.')
//     expect(analyticsStub.called).to.be.false
//   })
//
//   it('should not initialise analytics if not consented', () => {
//     cookieBannerObject.setCookieConsent(false)
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":false,"SameSite":"Lax"}')
//     expect(document.body.innerHTML).to.contain('You told us not to use analytics cookies.')
//     expect(analyticsStub.called).to.be.false
//   })
//
//   it('should not display cookie banner and initialise analytics if previously consented', () => {
//     // set consent cookie before initialising cookie banner
//     cookieBannerObject.setCookieConsent(true)
//     window.analyticsTrackingId = 'test'
//
//     cookieBannerObject = initCookieBanner()
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
//     expect(cookieBannerObject.$module.style.display).to.be.equal('none')
//     expect(analyticsStub.calledOnce).to.be.true
//   })
//
//   it('should not display cookie banner and not initialise analytics if not previously consented', () => {
//     // set consent cookie before initialising cookie banner
//     cookieBannerObject.setCookieConsent(false)
//
//     cookieBannerObject = initCookieBanner()
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":false,"SameSite":"Lax"}')
//     expect(cookieBannerObject.$module.style.display).to.be.equal('none')
//     expect(analyticsStub.called).to.be.false
//   })
//
//   it('should not display cookie banner and not initialise analytics if previously consented but analytics ID is not configured', () => {
//     // set consent cookie before initialising cookie banner
//     cookieBannerObject.setCookieConsent(true)
//     window.analyticsTrackingId = ''
//
//     cookieBannerObject = initCookieBanner()
//
//     expect(document.cookie).to.include('govuk_pay_cookie_policy={"analytics":true,"SameSite":"Lax"}')
//     expect(cookieBannerObject.$module.style.display).to.be.equal('none')
//     expect(analyticsStub.called).to.be.false
//   })
// })
