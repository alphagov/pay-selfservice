'use strict'

const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const getApp = require('../../../../server').getApp
const supertest = require('supertest')
const paths = require('../../../../app/paths')
const expect = chai.expect
const session = require('../../../test_helpers/mock_session')
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}
const ACCOUNT_ID = '182364'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
const CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + '/card-types'
const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)
const csrf = require('csrf')

let app, response, $

function mockConnectorAcceptedCardTypesEndpoint (acceptedCardTypes) {
  connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
    .reply(200, acceptedCardTypes)
}

describe.only('The 3D Secure index endpoint', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = [{name: 'toggle-3ds:update'}, {name: 'toggle-3ds:read'}]
    const user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: permissions
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'worldpay',
        'requires3ds': false
      })

    mockConnectorAcceptedCardTypesEndpoint({'card_types': []})

    supertest(app)
      .get(paths.toggle3ds.index)
      .set('x-request-id', requestId)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
  })

  it(`should display helper text for WordlPay 3DS`, () => {
    expect(response.statusCode).to.equal(200)
    expect($('.page-title').text()).to.contain('3D Secure')
    expect($('#3ds-helper-text-worldpay').text()).to.contain('Activating 3D Secure')
  })
})

describe.only('The 3D Secure index endpoint', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = [{name: 'toggle-3ds:update'}, {name: 'toggle-3ds:read'}]
    const user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: permissions
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'smartpay',
        'requires3ds': false
      })

    mockConnectorAcceptedCardTypesEndpoint({'card_types': []})

    supertest(app)
      .get(paths.toggle3ds.index)
      .set('x-request-id', requestId)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
  })

  it(`should not display helper text if not WordlPay 3DS`, () => {
    expect(response.statusCode).to.equal(200)
    expect($('.page-title').text()).to.contain('3D Secure')
    expect($('#3ds-helper-text-worldpay').text()).to.equal('')
  })
})

describe.only('The 3D Secure confirmation page for WorldPay account', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = [{name: 'toggle-3ds:update'}, {name: 'toggle-3ds:read'}]
    const user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: permissions
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'worldpay',
        'requires3ds': false
      })

    mockConnectorAcceptedCardTypesEndpoint({'card_types': []})

    const csrfToken = csrf().create('123')

    supertest(app)
      .post(paths.toggle3ds.onConfirm)
      .send({'csrfToken': csrfToken})
      .set('x-request-id', requestId)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
  })

  it(`should display helper text if WordlPay 3DS`, () => {
    expect(response.statusCode).to.equal(200)
    expect($('.page-title').text()).to.contain('3D Secure')
    expect($('#3ds-helper-text-worldpay').text()).to.contain('If you haven’t confirmed this with Worldpay')
  })
})

describe.only('The 3D Secure confirmation page for non WorldPay account', () => {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = [{name: 'toggle-3ds:update'}, {name: 'toggle-3ds:read'}]
    const user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: permissions
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'smartpay',
        'requires3ds': false
      })

    mockConnectorAcceptedCardTypesEndpoint({'card_types': []})

    const csrfToken = csrf().create('123')

    supertest(app)
      .post(paths.toggle3ds.onConfirm)
      .send({'csrfToken': csrfToken})
      // .set('Accept', 'application/json')
      // .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('x-request-id', requestId)
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
  })

  it(`should not display helper text if not WordlPay 3DS`, () => {
    expect(response.statusCode).to.equal(200)
    expect($('.page-title').text()).to.contain('3D Secure')
    expect($('#3ds-helper-text-worldpay').text()).to.equal('')
  })
})
