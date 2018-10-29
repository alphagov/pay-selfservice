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
const ID_3DS_HELPER_TEXT = '#3ds-helper-text-worldpay'

let app, response, $

function mockConnectorAcceptedCardTypesEndpoint (acceptedCardTypes) {
  connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
    .reply(200, acceptedCardTypes)
}

function runConnectorMockGet (accountName) {
  connectorMock.get(CONNECTOR_ACCOUNT_PATH)
    .reply(200, {
      'payment_provider': accountName,
      'requires3ds': false
    })
  mockConnectorAcceptedCardTypesEndpoint({'card_types': []})
}

function getToggle3DsIndex (accountName, done) {
  runConnectorMockGet(accountName)

  supertest(app)
    .get(paths.toggle3ds.index)
    .set('x-request-id', requestId)
    .end((err, res) => {
      response = res
      $ = cheerio.load(res.text || '')
      done(err)
    })
}

function postToggle3DsIndexConfirm (accountName, done) {
  runConnectorMockGet(accountName)

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
}

function assertStatusAndTitle () {
  expect(response.statusCode).to.equal(200)
  expect($('.govuk-heading-l').text()).to.contain('3D Secure')
}

describe('The 3D Secure ', () => {
  const permissions = [{name: 'toggle-3ds:update'}, {name: 'toggle-3ds:read'}]
  const user = session.getUser({
    gateway_account_ids: [ACCOUNT_ID], permissions: permissions
  })

  beforeEach(function () {
    app = session.getAppWithLoggedInUser(getApp(), user)
  })

  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  describe('index endpoint', () => {
    describe('for WorldPay account', () => {
      beforeEach(function (done) {
        getToggle3DsIndex('worldpay', done)
      })
      it(`should display helper text`, () => {
        assertStatusAndTitle()
        expect($(ID_3DS_HELPER_TEXT).text()).to.contain('Activating 3D Secure')
      })
    })

    describe('for non WorldPay account', () => {
      beforeEach(function (done) {
        getToggle3DsIndex('smartpay', done)
      })
      it(`should not display helper text`, () => {
        assertStatusAndTitle()
        expect($(ID_3DS_HELPER_TEXT).text()).to.equal('')
      })
    })
  })

  describe('confirmation page', () => {
    describe('for WorldPay account', () => {
      beforeEach((done) => {
        postToggle3DsIndexConfirm('worldpay', done)
      })
      it(`should display helper text`, () => {
        assertStatusAndTitle()
        expect($(ID_3DS_HELPER_TEXT).text()).to.contain('If you haven’t confirmed this with Worldpay')
      })
    })

    describe('for non WorldPay account', () => {
      beforeEach((done) => {
        postToggle3DsIndexConfirm('smartpay', done)
      })
      it('should not display helper text', () => {
        assertStatusAndTitle()
        expect($(ID_3DS_HELPER_TEXT).text()).to.equal('')
      })
    })
  })
})
