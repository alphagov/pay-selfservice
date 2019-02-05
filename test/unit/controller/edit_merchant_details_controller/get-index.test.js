const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const mockSession = require('../../../test_helpers/mock_session.js')
const getApp = require('../../../../server.js').getApp
const supertest = require('supertest')
const userFixtures = require('../../../fixtures/user_fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace_params_in_path')
const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'
let response, user, $

describe('Organisation details controller - get', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  const EXTERNAL_ID_IN_SESSION = 'exsfjpwoi34op23i4'
  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  describe('when the organisation already has details (CREDIT CARD GATEWAY ACCOUNT)', () => {
    before(done => {
      let serviceRoles = [{
        service: {
          name: 'System Generated',
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
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserResponse(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
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
      let serviceRoles = [{
        service: {
          name: 'System Generated',
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
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserResponse(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
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
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['20'],
          merchant_details: undefined
        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserResponse(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
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
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere'],
          merchant_details: undefined

        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserResponse(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
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
      let serviceRoles = [{
        service: {
          name: 'System Generated',
          external_id: EXTERNAL_SERVICE_ID,
          gateway_account_ids: ['DIRECT_DEBIT:somerandomidhere', '12345'],
          merchant_details: undefined

        },
        role: {
          name: 'admin',
          description: 'Administrator',
          permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
        }
      }]
      let userInSession = mockSession.getUser({
        external_id: EXTERNAL_ID_IN_SESSION,
        service_roles: serviceRoles
      })
      user = userFixtures.validUserResponse(userInSession)
      adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_IN_SESSION}`)
        .reply(200, user.getPlain())
      const app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
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
