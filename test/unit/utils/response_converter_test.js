let path = require('path')
let responseConverter = require(path.join(__dirname, '/../../../app/utils/response_converter'))
let chai = require('chai')
chai.should()
let chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect
let q = require('q')

let defer
let context

describe('response converter', function () {
  beforeEach(() => {
    defer = q.defer()
    context = {
      url: 'http://example.com',
      defer: defer,
      startTime: new Date(),
      correlationId: 'bob',
      method: 'POST',
      description: 'sample request',
      service: 'sample service'
    }
  })

  let noError
  let body = {}

  it('should resolve if response is any one of success codes', function (done) {
    let noOfSuccessCodes = responseConverter.successCodes().length

    expect(noOfSuccessCodes).to.be.equal(5)

    responseConverter.successCodes().forEach((code, index) => {
      let converter = responseConverter.createCallbackToPromiseConverter(context)
      let successResponse = {statusCode: code}
      converter(noError, successResponse, body)

      defer.promise.should.be.fulfilled
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

    defer.promise.should.be.rejected.then((res) => {
      expect(res.errorCode).to.equal(401)
    }).should.notify(done)
  })

  it('should reject if response returned with an error', function (done) {
    let converter = responseConverter.createCallbackToPromiseConverter(context)
    let response = {}
    let error = 'error'
    converter(error, response, body)

    defer.promise.should.be.rejected.then((res) => {
      expect(res.error).to.equal('error')
    }).should.notify(done)
  })
})
