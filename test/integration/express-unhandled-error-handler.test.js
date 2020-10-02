'use strict'

const supertest = require('supertest')
const cheerio = require('cheerio')

jest.mock('./app/routes', () => ({
  bind: (app) => {
    app.get(testPath, () => { throw Error('an unhandled error') })
  }
}));

describe('express unhandled error handler', () => {
  describe('should render the error page when there is an unhandled error', () => {
    const testPath = '/test-error'
    let response, $

    beforeAll(done => {
      const { getApp } = require('../../server')

      supertest(getApp())
        .get(testPath)
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    it('should respond with a code of 500', () => {
      expect(response.statusCode).toBe(500)
    })

    it('should show the error page', () => {
      expect($('.page-title').text()).toBe('An error occurred:')
    })

    it('should tell the user to contact support', () => {
      expect($('#errorMsg').text()).toBe(
        'There is a problem with the payments platform. Please contact the support team.'
      )
    })
  })
})
