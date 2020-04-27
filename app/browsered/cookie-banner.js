'use strict'

const analytics = require('./analytics')
const cookieFunction = require('./cookie-functions')

const CookieBanner = function ($module) {
  this.$module = $module
}

CookieBanner.prototype.init = function () {
  this.$module.hideCookieMessage = this.hideCookieMessage.bind(this)
  this.$module.showConfirmationMessage = this.showConfirmationMessage.bind(this)
  this.$module.setCookieConsent = this.setCookieConsent.bind(this)

  this.$module.cookieBanner = document.querySelector('.pay-cookie-banner')
  this.$module.cookieBannerConfirmationMessage = this.$module.querySelector('.pay-cookie-banner__confirmation')

  this.setupCookieMessage()
}

CookieBanner.prototype.setupCookieMessage = function () {
  this.$hideLink = this.$module.querySelector('button[data-hide-cookie-banner]')
  if (this.$hideLink) {
    this.$hideLink.addEventListener('click', this.$module.hideCookieMessage)
  }

  this.$acceptCookiesLink = this.$module.querySelector('button[data-accept-cookies=true]')
  if (this.$acceptCookiesLink) {
    this.$acceptCookiesLink.addEventListener('click', () => this.$module.setCookieConsent(true))
  }

  this.$rejectCookiesLink = this.$module.querySelector('button[data-accept-cookies=false]')
  if (this.$rejectCookiesLink) {
    this.$rejectCookiesLink.addEventListener('click', () => this.$module.setCookieConsent(false))
  }

  this.showCookieMessage()
}

CookieBanner.prototype.showCookieMessage = function () {
  // Show the cookie banner if policy cookie not set
  let hasCookiesPolicy = cookieFunction.getCookie(cookieFunction.GOV_UK_PAY_COOKIE_POLICY)

  if (this.$module) {
    if (!hasCookiesPolicy) {
      this.$module.style.display = 'block'
    } else {
      const consentCookieObj = cookieFunction.getConsentCookie()
      if (consentCookieObj && consentCookieObj.analytics === true) {
        initialiseAnalytics(true)
      }
      this.$module.style.display = 'none'
    }
  }
}

CookieBanner.prototype.hideCookieMessage = function (event) {
  if (this.$module) {
    this.$module.style.display = 'none'
  }

  if (event.target) {
    event.preventDefault()
  }
}

CookieBanner.prototype.setCookieConsent = function (analyticsConsent) {
  cookieFunction.setConsentCookie({ analytics: analyticsConsent })

  this.$module.showConfirmationMessage(analyticsConsent)
  this.$module.cookieBannerConfirmationMessage.focus()
  initialiseAnalytics(analyticsConsent)
}

function initialiseAnalytics (analyticsConsent) {
  // analyticsTrackingId is configurable and set globally in head.njk
  // eslint-disable-next-line no-undef
  if (analyticsConsent && analyticsTrackingId) { analytics.init() }
}

CookieBanner.prototype.showConfirmationMessage = function (analyticsConsent) {
  let messagePrefix = analyticsConsent ? 'You’ve accepted analytics cookies.' : 'You told us not to use analytics cookies.'

  this.$cookieBannerMainContent = document.querySelector('.pay-cookie-banner__wrapper')
  this.$cookieBannerConfirmationMessage = document.querySelector('.pay-cookie-banner__confirmation-message')

  this.$cookieBannerConfirmationMessage.insertAdjacentText('afterbegin', messagePrefix)
  this.$cookieBannerMainContent.style.display = 'none'
  this.$module.cookieBannerConfirmationMessage.style.display = 'block'
}

module.exports.initCookieBanner = () => {
  const $cookieBanner = document.querySelector('.pay-cookie-banner')
  if ($cookieBanner) {
    let cookieBanner = new CookieBanner($cookieBanner)
    cookieBanner.init()
    return cookieBanner
  }
}
