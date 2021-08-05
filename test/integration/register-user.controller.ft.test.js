'use strict'

const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const paths = require('../../app/paths')
const getApp = require('../../server').getApp
const session = require('../test-helpers/mock-session')
const userFixtures = require('../fixtures/user.fixtures')

chai.use(chaiAsPromised)

const adminusersMock = nock(process.env.ADMINUSERS_URL)
const INVITE_RESOURCE_PATH = '/v1/api/invites'
const expect = chai.expect

let app
let mockRegisterAccountCookie

describe('register user controller', () => {
  beforeEach(done => {
    mockRegisterAccountCookie = {}
    app = session.getAppWithRegisterInvitesCookie(getApp(), mockRegisterAccountCookie)
    done()
  })

  afterEach(done => {
    nock.cleanAll()
    app = null
    done()
  })

  /**
   *  ENDPOINT showRegistration
   */
  describe('show registration view endpoint', () => {
    it('should display create account form', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      supertest(app)
        .get(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal('invitee@example.com')
        })
        .end(done)
    })

    it('should display create account form with telephone populated, if invite has been attempted', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'
      mockRegisterAccountCookie.telephone_number = '+441134960000'

      supertest(app)
        .get(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.email).to.equal('invitee@example.com')
          expect(res.body.telephone_number).to.equal('+441134960000')
        })
        .end(done)
    })

    it('should display error when email and/or code is not in the cookie', done => {
      supertest(app)
        .get(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })
  })

  /**
   *  ENDPOINT submitRegistration
   */

  describe('submit registration details endpoint', () => {
    it('should error if cookie details are missing', done => {
      supertest(app)
        .post(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          csrfToken: csrf().create('123')
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })

    it('should redirect back to registration form if error in phone number', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      const invalidPhone = 'abc'
      supertest(app)
        .post(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': invalidPhone,
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.registerUser.registration)
        .expect((res) => {
          expect(mockRegisterAccountCookie)
            .to.have.property('recovered')
            .to.deep.equal({
              telephoneNumber: invalidPhone,
              errors: {
                telephoneNumber: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
              }
            })
        })
        .end(done)
    })

    it('should redirect to phone verification page', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/${mockRegisterAccountCookie.code}/otp/generate`)
        .reply(200)

      supertest(app)
        .post(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': '+441134960000',
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.registerUser.otpVerify)
        .end(done)
    })

    it('should error for valid registration data, if code not found', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/${mockRegisterAccountCookie.code}/otp/generate`)
        .reply(404)

      supertest(app)
        .post(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': '+441134960000',
          'password': 'password1234',
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .end(done)
    })
  })

  /**
   *  ENDPOINT showOtpVerify
   */
  describe('show otp verify endpoint', () => {
    it('should error if cookie details are missing', done => {
      supertest(app)
        .get(paths.registerUser.otpVerify)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })

    it('should display verify otp page successfully', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      supertest(app)
        .get(paths.registerUser.registration)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .end(done)
    })
  })

  /**
   *  ENDPOINT submitOtpVerify
   */
  describe('validate otp code endpoint', () => {
    it('should validate otp code successfully', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'
      const newUserExtId = 'new-user-ext-id'
      const validUserResponse = userFixtures.validUserResponse({ external_id: newUserExtId })

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/validate`)
        .reply(201, validUserResponse)

      supertest(app)
        .post(paths.registerUser.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.registerUser.logUserIn)
        .expect(() => {
          expect(mockRegisterAccountCookie.userExternalId).to.equal(newUserExtId)
        })
        .end(done)
    })

    it('should error if cookie details are missing', done => {
      supertest(app)
        .post(paths.registerUser.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })

    it('should error and allow user to reenter otp if invalid otp code entry', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      supertest(app)
        .post(paths.registerUser.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': 'hfwe67q', // non-numeric
          csrfToken: csrf().create('123')
        })
        .expect(303)
        .expect('Location', paths.registerUser.otpVerify)
        .end(done)
    })

    it('should error if error during otp code verification', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/validate`)
        .reply(404)

      supertest(app)
        .post(paths.registerUser.otpVerify)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'verify-code': '123456',
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .end(done)
    })
  })

  /**
   *  ENDPOINT showReVerifyPhone
   */
  describe('show re-verify phone endpoint', () => {
    it('should display re verify otp code form with pre-populated telephone number', done => {
      const telephoneNumber = '+441134960000'

      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'
      mockRegisterAccountCookie.telephone_number = telephoneNumber

      supertest(app)
        .get(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(200)
        .expect((res) => {
          expect(res.body.telephone_number).to.equal(telephoneNumber)
        })
        .end(done)
    })

    it('should display error when email and/or code is not in the cookie', done => {
      supertest(app)
        .get(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })
  })

  /**
   *  ENDPOINT submitReVerifyPhone
   */
  describe('submit re-verify phone endpoint', () => {
    it('should proceed to verify otp upon successful telephone number re-entry', done => {
      const telephoneNumber = '+441134960000'

      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/resend`)
        .reply(200)

      supertest(app)
        .post(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.registerUser.otpVerify)
        .end(done)
    })

    it('should error on an error during resend otp', done => {
      const telephoneNumber = '+441134960000'

      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      adminusersMock.post(`${INVITE_RESOURCE_PATH}/otp/resend`)
        .reply(404)

      supertest(app)
        .post(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(500)
        .end(done)
    })

    it('should redirect back to re verify phone view if error in phone number', done => {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      const invalidPhone = 'abc'

      supertest(app)
        .post(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': invalidPhone,
          csrfToken: csrf().create('123')
        })
        .expect(303, {})
        .expect('Location', paths.registerUser.reVerifyPhone)
        .expect((res) => {
          expect(mockRegisterAccountCookie)
            .to.have.property('recovered')
            .to.deep.equal({
              telephoneNumber: invalidPhone,
              errors: {
                telephoneNumber: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
              }
            })
        })
        .end(done)
    })

    it('should error if cookie details are missing', done => {
      const telephoneNumber = '+441134960000'
      supertest(app)
        .post(paths.registerUser.reVerifyPhone)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('x-request-id', 'bob')
        .send({
          'telephone-number': telephoneNumber,
          csrfToken: csrf().create('123')
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.equal('There has been a problem proceeding with this registration. Please try again.')
        })
        .end(done)
    })
  })
})
