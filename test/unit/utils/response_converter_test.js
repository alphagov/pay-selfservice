'use strict'

// NPM dependencies
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Local dependencies
const responseConverter = require(path.join(__dirname, '/../../../app/utils/response_converter'))

chai.should()
chai.use(chaiAsPromised)

let context
const expect = chai.expect

describe('response converter', function () {
  beforeEach(() => {
    context = {
      url: 'http://example.com',
      defer: {resolve: Promise.resolve(), reject: Promise.reject(new Error())},
      startTime: new Date(),
      correlationId: 'bob',
      method: 'POST',
      description: 'sample request',
      service: 'sample service'
    }
  })

  let noError
  let body = {}

  it.only('should resolve if response is any one of success codes', function (done) {
    let noOfSuccessCodes = responseConverter.successCodes().length

    expect(noOfSuccessCodes).to.be.equal(5)

    responseConverter.successCodes().forEach((code, index) => {
      let converter = responseConverter.createCallbackToPromiseConverter(context)
      let successResponse = {statusCode: code}

      converter(noError, successResponse, body)

      converter.should.be.fulfilled
        .notify(() => {
          // call done only if its the last index
          if (index === noOfSuccessCodes - 1) {
            done()
          }
        })
    })
  })

  it('should reject if response returned with a non success code', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context)
    let errorResponse = {statusCode: 401}
    converter(noError, errorResponse, body)

    converter.should.be.rejected.then((res) => {
      expect(res.errorCode).to.equal(401)
    }).should.notify(done)
  })

  it('should reject if response returned with an error', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context)
    let response = {}
    let error = 'error'
    converter(error, response, body)

    converter.should.be.rejected.then((res) => {
      expect(res.error).to.equal('error')
    }).should.notify(done)
  })
})
