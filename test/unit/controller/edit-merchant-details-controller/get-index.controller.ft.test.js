'use strict'

const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')

const mockSession = require('../../../test-helpers/mock-session.js')
const getApp = require('../../../../server.js').getApp
const userFixtures = require('../../../fixtures/user.fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')
const User = require('../../../../app/models/User.class')
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

let response, $

describe('Organisation details controller - get', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  const adminRole = {
    name: 'admin',
    description: 'Administrator',
    permissions: [{ name: 'merchant-details:read' }, { name: 'merchant-details:update' }]
  }

  describe('when the organisation already has details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name',
              telephone_number: '',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB',
              email: ''
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it(`should show table with the organisation details`, () => {
      expect($('#merchant-name').text()).to.contain('name')
      expect($('#merchant-address').text()).to.contain('line1')
      expect($('#merchant-address').text()).to.contain('line2')
      expect($('#merchant-address').text()).to.contain('City')
      expect($('#merchant-address').text()).to.contain('POSTCODE')
      expect($('#merchant-address').text()).to.contain('United Kingdom')
    })
  })
  describe('when the merchant already has details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
            merchant_details: {
              name: 'name',
              telephone_number: '03069990000',
              address_line1: 'line1',
              address_line2: 'line2',
              address_city: 'City',
              address_postcode: 'POSTCODE',
              address_country: 'GB',
              email: 'dd-merchant@example.com'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 200 status code`, () => {
      expect(response.statusCode).to.equal(200)
    })
    it(`should show table with the organisation details`, () => {
      expect($('#merchant-name').text()).to.contain('name')
      expect($('#telephone-number').text()).to.contain('03069990000')
      expect($('#merchant-email').text()).to.contain('dd-merchant@example.com')
      expect($('#merchant-address').text()).to.contain('line1')
      expect($('#merchant-address').text()).to.contain('line2')
      expect($('#merchant-address').text()).to.contain('City')
      expect($('#merchant-address').text()).to.contain('POSTCODE')
      expect($('#merchant-address').text()).to.contain('United Kingdom')
    })
  })
  describe('when the merchant has empty details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: undefined
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').to.equal(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('should redirect to edit when the merchant name is set but not the address', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').to.equal(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('should redirect to edit when the mandatory address fields have not been set', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['20'],
            merchant_details: {
              name: 'name',
              address_line1: 'line1'
            }
          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').to.equal(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
            merchant_details: undefined

          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').to.equal(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
  describe('when the merchant has empty details (DIRECT DEBIT GATEWAY ACCOUNT and CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      const user = userFixtures.validUserResponse({
        service_roles: [{
          service: {
            external_id: EXTERNAL_SERVICE_ID,
            gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere', '12345'],
            merchant_details: undefined

          },
          role: adminRole
        }]
      })
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user)
      const app = mockSession.getAppWithLoggedInUser(getApp(), new User(user))
      supertest(app)
        .get(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it(`should get a nice 302 status code`, () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to the edit page', () => {
      expect(response.headers).to.have.property('location').to.equal(formattedPathFor(paths.merchantDetails.edit, EXTERNAL_SERVICE_ID))
    })
  })
})
