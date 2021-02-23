'use strict'

const proxyquire = require('proxyquire')
const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')

describe('express unhandled error handler', () => {
  describe('should render the error page when there is an unhandled error', () => {
    const testPath = '/test-error'
    let response, $

    before(done => {
      const { getApp } = proxyquire('../../server', {
        './app/routes': {
          bind: (app) => {
            app.get(testPath, () => { throw Error('an unhandled error') })
          }
        }
      })

      supertest(getApp())
        .get(testPath)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    it('should respond with a code of 500', () => {
      expect(response.statusCode).to.equal(500)
    })

    it('should show the error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred')
    })

    it('should tell the user to contact support', () => {
      expect($('#errorMsg').text()).to.equal('There is a problem with the payments platform. Please contact the support team.')
    })
  })
})
