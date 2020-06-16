'use strict'

const nock = require('nock')
const supertest = require('supertest')
const csrf = require('csrf')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const paths = require('../../app/paths')
const getApp = require('../../server').getApp
const session = require('../test_helpers/mock_session')
const inviteFixtures = require('../fixtures/invite_fixtures')

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
   *  ENDPOINT validateInvite
   */
  describe('verify invitation endpoint', () => {
    it('should redirect to register view on a valid user invite with non existing user', done => {
      const code = '23rer87t8shjkaf'
      const type = 'user'
      const opts = {
        type,
        user_exist: false
      }
      const validInviteResponse = inviteFixtures.validInviteResponse(opts).getPlain()

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse)

      supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.registerUser.registration)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code)
          expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email)
        })
        .end(done)
    })

    it('should redirect to subscribe service view on a valid user invite with existing user', done => {
      const code = '23rer87t8shjkaf'
      const type = 'user'
      const opts = {
        type,
        user_exist: true
      }
      const validInviteResponse = inviteFixtures.validInviteResponse(opts).getPlain()

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse)

      supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.registerUser.subscribeService)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code)
          expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email)
        })
        .end(done)
    })

    it('should redirect to otp verify view on a valid service invite with non existing user', done => {
      const code = '23rer87t8shjkaf'
      const type = 'service'
      const telephoneNumber = '+441134960000'
      const opts = {
        type,
        telephone_number: telephoneNumber,
        user_exist: false
      }
      const validInviteResponse = inviteFixtures.validInviteResponse(opts).getPlain()

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse)
      adminusersMock.post(`${INVITE_RESOURCE_PATH}/${code}/otp/generate`)
        .reply(200)

      supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.selfCreateService.otpVerify)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code)
          expect(mockRegisterAccountCookie.telephone_number).to.equal(telephoneNumber)
        })
        .end(done)
    })

    it('should redirect to \'My services\' view on a valid service invite with existing user', done => {
      const code = '23rer87t8shjkaf'
      const type = 'service'
      const opts = {
        type,
        user_exist: true
      }
      const validInviteResponse = inviteFixtures.validInviteResponse(opts).getPlain()

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse)

      supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.serviceSwitcher.index)
        .end(done)
    })

    it('should redirect to register with telephone number, if user did not complete previous attempt after entering registration details', done => {
      const code = '7s8ftgw76rwgu'
      const telephoneNumber = '+441134960000'
      const validInviteResponse = inviteFixtures.validInviteResponse({ telephone_number: telephoneNumber }).getPlain()

      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${code}`)
        .reply(200, validInviteResponse)

      supertest(app)
        .get(`/invites/${code}`)
        .set('x-request-id', 'bob')
        .expect(302)
        .expect('Location', paths.registerUser.registration)
        .expect(() => {
          expect(mockRegisterAccountCookie.code).to.equal(code)
          expect(mockRegisterAccountCookie.email).to.equal(validInviteResponse.email)
          expect(mockRegisterAccountCookie.telephone_number).to.equal(telephoneNumber)
        })
        .end(done)
    })

    it('should error if the invite code is invalid', done => {
      const invalidCode = 'invalidCode'
      adminusersMock.get(`${INVITE_RESOURCE_PATH}/${invalidCode}`)
        .reply(404)

      supertest(app)
        .get(`/invites/${invalidCode}`)
        .set('Accept', 'application/json')
        .set('x-request-id', 'bob')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time')
        })
        .end(done)
    })
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
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time')
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
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time')
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
          expect(mockRegisterAccountCookie.telephone_number).to.equal(invalidPhone)
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
        .expect(404)
        .expect((res) => {
          expect(res.body.message).to.equal('Unable to process registration at this time')
        })
        .end(done)
    })
  })
})
