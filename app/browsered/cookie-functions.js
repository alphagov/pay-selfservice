'use strict'

const DEFAULT_COOKIE_CONSENT = {
  analytics: false
}

const COOKIE_CATEGORIES = {
  _ga: 'analytics',
  _gid: 'analytics',
  _gat_govuk_shared: 'analytics'
}

const GOV_UK_PAY_COOKIE_POLICY = 'govuk_pay_cookie_policy'

function getCookie (name) {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')
  for (let i = 0, len = cookies.length; i < len; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

/*
Cookie methods
==============

Usage:

  Setting a cookie:
  setCookie('hobnob', 'tasty', { days: 30 })

  Reading a cookie:
  getCookie('hobnob')

  Deleting a cookie:
  Cookie('hobnob', null)
*/

function Cookie (name, value, options) {
  if (typeof value !== 'undefined') {
    if (value === false || value === null) {
      return setCookie(name, '', { days: -1 })
    } else {
      // Default expiry date of 30 days
      if (typeof options === 'undefined') {
        options = { days: 30 }
      }
      return setCookie(name, value, options)
    }
  } else {
    return getCookie(name)
  }
}

function getConsentCookie () {
  const consentCookie = getCookie(GOV_UK_PAY_COOKIE_POLICY)
  let consentCookieObj

  if (consentCookie) {
    try {
      consentCookieObj = JSON.parse(consentCookie)
    } catch (err) {
      return null
    }

    if (typeof consentCookieObj !== 'object' && consentCookieObj !== null) {
      consentCookieObj = JSON.parse(consentCookieObj)
    }
  } else {
    return null
  }

  return consentCookieObj
}

function setConsentCookie (options) {
  let cookieConsent = getConsentCookie()

  if (!cookieConsent) {
    cookieConsent = JSON.parse(JSON.stringify(DEFAULT_COOKIE_CONSENT))
  }

  for (const cookieType in options) {
    cookieConsent[cookieType] = options[cookieType]

    // Delete cookies of that type if consent being set to false
    if (!options[cookieType]) {
      for (const cookie in COOKIE_CATEGORIES) {
        if (COOKIE_CATEGORIES[cookie] === cookieType) {
          Cookie(cookie, null)

          if (Cookie(cookie)) {
            document.cookie = cookie + '=;expires=' + new Date() + ';domain=' +
              getCookieDomain() + ';path=/'
          }
        }
      }
    }
  }

  setCookie(GOV_UK_PAY_COOKIE_POLICY, JSON.stringify(cookieConsent), { days: 365 })
}

function getCookieDomain () {
  return window.location.hostname.replace(/^(www.){0,1}(selfservice.){0,1}/, '.')
}

function checkConsentCookieCategory (cookieName, cookieCategory) {
  let currentConsentCookie = getConsentCookie()

  // If the consent cookie doesn't exist, but the cookie is in our known list, return true
  if (!currentConsentCookie && COOKIE_CATEGORIES[cookieName]) {
    return true
  }

  currentConsentCookie = getConsentCookie()

  // Sometimes currentConsentCookie is malformed in some of the tests, so we need to handle these
  try {
    return currentConsentCookie[cookieCategory]
  } catch (e) {
    console.error(e)
    return false
  }
}

function checkConsentCookie (cookieName, cookieValue) {
  // If we're setting the consent cookie OR deleting a cookie, allow by default
  if (cookieName === GOV_UK_PAY_COOKIE_POLICY || (cookieValue === null || cookieValue === false)) {
    return true
  }

  if (COOKIE_CATEGORIES[cookieName]) {
    const cookieCategory = COOKIE_CATEGORIES[cookieName]

    return checkConsentCookieCategory(cookieName, cookieCategory)
  } else {
    // Deny the cookie if it is not known to us
    return false
  }
}

// Usage :
// Setting a cookie:
// Cookie('hobnob', 'tasty', { days: 30 })
function setCookie (name, value, options) {
  if (checkConsentCookie(name, value)) {
    if (typeof options === 'undefined') {
      options = {}
    }
    let cookieString = name + '=' + value + '; path=/; domain=' + getCookieDomain()
    if (options.days) {
      const date = new Date()
      date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000))
      cookieString = cookieString + '; expires=' + date.toGMTString()
    }
    if (document.location.protocol === 'https:') {
      cookieString = cookieString + '; Secure'
    }
    document.cookie = cookieString
    return cookieString
  }
}

module.exports = {
  setConsentCookie,
  getConsentCookie,
  getCookie,
  setCookie,
  getCookieDomain,
  GOV_UK_PAY_COOKIE_POLICY
}
