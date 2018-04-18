const chai = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const mockSession = require('../../../test_helpers/mock_session.js')
const getApp = require('../../../../server.js').getApp
const supertest = require('supertest')
const serviceFixtures = require('../../../fixtures/service_fixtures')
const paths = require('../../../../app/paths.js')
const formattedPathFor = require('../../../../app/utils/replace_params_in_path')
const csrf = require('csrf')
const expect = chai.expect
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const SERVICE_RESOURCE = '/v1/api/services'
let response, $
let session

describe('edit merchant details controller - post', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  const EXTERNAL_SERVICE_ID = 'dsfkbskjalksjdlk342'
  let serviceRoles = [{
    service: {
      name: 'System Generated',
      external_id: EXTERNAL_SERVICE_ID,
      gateway_account_ids: ['20', 'DIRECT_DEBIT:somerandomidhere'],
      merchant_details: {
        name: 'name',
        telephone_number: '03069990000',
        address_line1: 'line1',
        address_line2: 'line2',
        address_city: 'City',
        address_postcode: 'POSTCODE',
        address_country: 'GB'
      }
    },
    role: {
      name: 'admin',
      description: 'Administrator',
      permissions: [{name: 'merchant-details:read'}, {name: 'merchant-details:update'}]
    }
  }]
  describe('when the update merchant details call is successful', () => {
    before(done => {
      response = serviceFixtures.validUpdateMerchantDetailsResponse(serviceRoles[0].service.merchant_details).getPlain()
      adminusersMock.put(`${SERVICE_RESOURCE}/${EXTERNAL_SERVICE_ID}/merchant-details`)
        .reply(200, response)
      let userInSession = mockSession.getUser({
        external_id: 'exsfjpwoi34op23i4',
        service_roles: serviceRoles
      })
      session = {
        csrfSecret: '123',
        12345: {refunded_amount: 5},
        passport: {
          user: userInSession
        },
        secondFactor: 'totp',
        last_url: 'last_url',
        version: 0
      }
      let app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .post(formattedPathFor(paths.merchantDetails.update, EXTERNAL_SERVICE_ID))
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          'merchant-name': 'new-name',
          'telephone-number': '03069990001',
          'address-line1': 'new-line1',
          'address-city': 'new-city',
          'address-postcode': 'new-postcode',
          'address-country': 'AR',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it(`should redirect back to the page`, () => {
      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
    })
    it(`should set the success notification in the session`, () => {
      expect(session.pageData.editMerchantDetails.success).to.be.true // eslint-disable-line
      expect(session.pageData.editMerchantDetails).not.to.have.property('errors')
    })
    it(`should set the success notification in the session`, () => {
      expect(session.pageData.editMerchantDetails.success).to.be.true // eslint-disable-line
      expect(session.pageData.editMerchantDetails).not.to.have.property('errors')
    })
  })
  describe('when the update merchant details call is missing mandatory fields', () => {
    before(done => {
      response = serviceFixtures.validUpdateMerchantDetailsResponse(serviceRoles[0].service.merchant_details).getPlain()
      adminusersMock.put(`${SERVICE_RESOURCE}/${EXTERNAL_SERVICE_ID}/merchant-details`)
        .reply(200, response)
      let userInSession = mockSession.getUser({
        external_id: 'exsfjpwoi34op23i4',
        service_roles: serviceRoles
      })
      session = {
        csrfSecret: '123',
        12345: {refunded_amount: 5},
        passport: {
          user: userInSession
        },
        secondFactor: 'totp',
        last_url: 'last_url',
        version: 0
      }
      let app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .post(formattedPathFor(paths.merchantDetails.update, EXTERNAL_SERVICE_ID))
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          'address-city': 'new-city',
          'address-postcode': 'new-postcode',
          'address-country': 'AR',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it(`should redirect back to the page`, () => {
      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
    })
    it(`should the errors in the session`, () => {
      expect(session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(session.pageData.editMerchantDetails.errors).to.deep.equal({
        'merchant-name': true,
        'telephone-number': true,
        'address-line1': true
      })
    })
  })
  describe('when the update merchant details call has invalid postcode and the country is GB', () => {
    before(done => {
      response = serviceFixtures.validUpdateMerchantDetailsResponse(serviceRoles[0].service.merchant_details).getPlain()
      adminusersMock.put(`${SERVICE_RESOURCE}/${EXTERNAL_SERVICE_ID}/merchant-details`)
        .reply(200, response)
      let userInSession = mockSession.getUser({
        external_id: 'exsfjpwoi34op23i4',
        service_roles: serviceRoles
      })
      session = {
        csrfSecret: '123',
        12345: {refunded_amount: 5},
        passport: {
          user: userInSession
        },
        secondFactor: 'totp',
        last_url: 'last_url',
        version: 0
      }
      let app = mockSession.createAppWithSession(getApp(), session)
      supertest(app)
        .post(formattedPathFor(paths.merchantDetails.update, EXTERNAL_SERVICE_ID))
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          'merchant-name': 'new-name',
          'telephone-number': '03069990001',
          'address-line1': 'new-line1',
          'address-city': 'new-city',
          'address-postcode': 'wrong',
          'address-country': 'GB',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it(`should redirect back to the page`, () => {
      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal(formattedPathFor(paths.merchantDetails.index, EXTERNAL_SERVICE_ID))
    })
    it(`should set errors in the session`, () => {
      expect(session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
      expect(session.pageData.editMerchantDetails.errors).to.deep.equal({
        'address-postcode': true
      })
    })
  })
  describe('when the update merchant details call is unsuccessful', () => {
    before(done => {
      response = serviceFixtures.validUpdateMerchantDetailsResponse(serviceRoles[0].service.merchant_details).getPlain()
      adminusersMock.put(`${SERVICE_RESOURCE}/${EXTERNAL_SERVICE_ID}/merchant-details`)
        .reply(400, 'Oops something went wrong')
      let userInSession = mockSession.getUser({
        external_id: 'exsfjpwoi34op23i4',
        service_roles: serviceRoles
      })
      let app = mockSession.getAppWithLoggedInUser(getApp(), userInSession)
      supertest(app)
        .post(formattedPathFor(paths.merchantDetails.update, EXTERNAL_SERVICE_ID))
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          'merchant-name': 'new-name',
          'telephone-number': '03069990001',
          'address-line1': 'new-line1',
          'address-city': 'new-city',
          'address-postcode': 'new-postcode',
          'address-country': 'AR',
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should respond with a 500 code', () => {
      expect(response.statusCode).to.equal(500)
    })
    it('should render error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Oops something went wrong')
    })
  })
})
