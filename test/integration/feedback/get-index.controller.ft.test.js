'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

const { getApp } = require('../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../test-helpers/mock-session')
const paths = require('../../../app/paths')

describe('Feedback page GET', () => {
  let result, $, session
  before(done => {
    const user = getUser({
      permissions: [{ name: 'transactions:read' }]
    })

    session = getMockSession(user)
    supertest(createAppWithSession(getApp(), session))
      .get(paths.feedback)
      .end((err, res) => {
        result = res
        $ = cheerio.load(res.text)
        done(err)
      })
  })
  after(() => {
    nock.cleanAll()
  })

  it('should return a statusCode of 200', () => {
    expect(result.statusCode).to.equal(200)
  })

  it(`should have itself as the form action`, () => {
    expect($('form').attr('action')).to.equal(paths.feedback)
  })

  it(`should have a button with “Send feedback”`, () => {
    expect($('.govuk-button').text()).to.contain('Send feedback')
  })
})
