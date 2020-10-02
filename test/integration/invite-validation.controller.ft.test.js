'use strict'

const nock = require('nock')
const supertest = require('supertest')
const { expect } = require('chai')

const paths = require('../../app/paths')
const getApp = require('../../server').getApp
const session = require('../test-helpers/mock-session')
const inviteFixtures = require('../fixtures/invite.fixtures')

const adminusersMock = nock(process.env.ADMINUSERS_URL)
const INVITE_RESOURCE_PATH = '/v1/api/invites'

let app
let mockRegisterAccountCookie

describe('Invite validation tests', () => {
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
})
