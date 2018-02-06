'use strict'

// npm dependencies
const clientSession = require('client-sessions')
const cookieParser = require('cookie-parser')
const _ = require('lodash')

// local dependencies
const cookieConfig = require('../../config/cookie')

let configs = []

for (const property in cookieConfig) {
  configs.push(cookieConfig[property])
}

exports.CookieBuilder = class CookieBuilder {
  constructor () {
    this._cookies = {}

  }
  withUser(userFixture) {
    this.withCookie('session', {
      passport: {
        user: userFixture.external_id
      },
      version: userFixture.session_version || 0
    })
    this.withCookie('gateway_account', {
      currentGatewayAccountId: _.get(userFixture, 'service_roles[0].service.gateway_account_ids[0]')
    })
    return this
  }
  withSecondFactor(secondFactor) {
    this.withCookie('session', {
      secondFactor: secondFactor
    })
    return this
  }
  withCookie(cookieName, value) {
    this._cookies[cookieName] = Object.assign(this._cookies[cookieName] || {},  value)
    return this
  }
  build() {
    let cookiesArray = []
    Object.keys(this._cookies).forEach(cookieName => {
      const config = configs.find(config => config.cookieName === cookieName)
      const value = config ? clientSession.util.encode(config, this._cookies[cookieName]) : this._cookies[cookieName]
      cookiesArray.push(`${cookieName}=${value}`)
    })
    return cookiesArray.join('; ')
  }
}


exports.decryptCookie = (rawCookieHeader) => {
  const cookies = {}

  rawCookieHeader.forEach(rawCookie => {
    const formatted = {}
    const tuples = rawCookie
      .split(';')
      .map(cookie => cookie.split('=').map(item => item.trim()))
    const cookieName = tuples[0][0]
    const config = configs.find(config => config.cookieName === cookieName)
    tuples[0][0] = 'content'
    tuples.forEach(tuple => {
      formatted[tuple[0]] = tuple[1] || true
    })
    if (config) Object.assign(formatted, clientSession.util.decode(config, formatted.content))
    cookies[cookieName] = formatted
  })

  return cookies
}
