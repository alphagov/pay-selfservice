require('@test/test-helpers/serialize-mock.js')

// NPM modules
const nock = require('nock')
const supertest = require('supertest')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

const { expect } = chai

// Local modules
const session = require('@test/test-helpers/mock-session')
const { getApp } = require('@root/server')
const userFixtures = require('@test/fixtures/user.fixtures')

// Local constants
const adminusersMock = nock(process.env.ADMINUSERS_URL)
const USER_RESOURCE = '/v1/api/users'

let app
chai.use(chaiAsPromised)

describe('service users resource', () => {
  let EXTERNAL_ID_LOGGED_IN = '7d19aff33f8948deb97ed16b2912dcd3'
  const USER_EMAIL_LOGGED_IN = 'existing-user@example.com'

  afterEach(done => {
    nock.cleanAll()
    app = null
    done()
  })

  it('should show my profile', done => {
    const user = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      email: USER_EMAIL_LOGGED_IN,
      telephone_number: '+447876548778',
      // TODO: fix to use serviceRoles
      services: [{
        name: 'System Generated',
        external_id: '8348754ihuwk'
      }]
    }
    const userInSession = session.getUser(user)
    const getUserResponse = userFixtures.validUserResponse(user)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_LOGGED_IN}`)
      .reply(200, getUserResponse)

    app = session.getAppWithLoggedInUser(getApp(), userInSession)

    supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(200)
      .expect(res => {
        expect(res.body.email).to.equal(user.email)
        expect(res.body.telephone_number).to.equal(user.telephone_number)
      })
      .end(done)
  })

  it('should not show my profile without second factor', done => {
    const user = {
      external_id: EXTERNAL_ID_LOGGED_IN,
      email: USER_EMAIL_LOGGED_IN + '@example.com',
      telephone_number: '+447876548778',
      // TODO: fix to use serviceRoles
      services: [{
        name: 'System Generated',
        external_id: '3894hewfui'
      }]
    }
    const userInSession = session.getUser(user)
    const getUserResponse = userFixtures.validUserResponse(user)

    adminusersMock.get(`${USER_RESOURCE}/${EXTERNAL_ID_LOGGED_IN}`)
      .reply(200, getUserResponse)

    app = session.getAppWithSessionWithoutSecondFactor(getApp(), userInSession)

    supertest(app)
      .get('/my-profile')
      .set('Accept', 'application/json')
      .expect(302)
      .expect('Location', '/login')
      .end(done)
  })
})
