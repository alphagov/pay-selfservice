'use strict'

const path = require('path')
const chai = require('chai')
const sinon = require('sinon')

const responseConverter = require(path.join(__dirname, '/../../../app/utils/response-converter'))

chai.should()

let context
const expect = chai.expect
let spyResolve
let spyReject

describe('response converter', function () {
  beforeEach(() => {
    context = {
      url: 'http://example.com',
      defer: {
        resolve: () => {
        },
        reject: () => {
        }
      },
      startTime: new Date(),
      correlationId: 'bob',
      method: 'POST',
      description: 'sample request',
      service: 'sample service'
    }

    spyResolve = sinon.spy(context.defer, 'resolve')
    spyReject = sinon.spy(context.defer, 'reject')
  })

  let noError
  const body = {}

  it('should resolve if response is any one of success codes', function (done) {
    const noOfSuccessCodes = responseConverter.successCodes().length

    expect(noOfSuccessCodes).to.be.equal(5)

    responseConverter.successCodes().forEach((code, index) => {
      const converter = responseConverter.createCallbackToPromiseConverter(context)
      const successResponse = { statusCode: code }

      converter(noError, successResponse, body)

      sinon.assert.called(spyResolve)

      if (index === noOfSuccessCodes - 1) {
        done()
      }
    })
  })

  it('should reject if response returned with a non success code', function (done) {
    const converter = responseConverter.createCallbackToPromiseConverter(context)
    const errorResponse = { statusCode: 401 }
    converter(noError, errorResponse, body)

    sinon.assert.calledWith(spyReject, { errorCode: errorResponse.statusCode, message: undefined })

    done()
  })

  it('should reject if response returned with an error', function (done) {
    const converter = responseConverter.createCallbackToPromiseConverter(context)
    const response = {}
    const error = 'error'
    converter(error, response, body)

    sinon.assert.calledWith(spyReject, { error: error })

    done()
  })
})
