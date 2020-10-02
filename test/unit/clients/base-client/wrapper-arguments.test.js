'use strict'

const sinon = require('sinon')

const wrapper = require('../../../../app/services/clients/base-client/wrapper')

describe('wrapper: arguments handling', () => {
  describe('wrapper arguments', () => {
    describe('when the verb argument is set', () => {
      const method = function (options, callback) {
        callback(null, { statusCode: 200, request: options })
      }
      const methodSpy = sinon.spy(method)
      beforeAll(done => {
        wrapper(methodSpy, 'get')({ url: 'http://www.example.com' })
          .then(() => done())
          .catch(() => done())
      })
      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(methodSpy.called).toBe(true)
        expect(methodSpy.callCount).toBe(1)
        expect(methodSpy.lastCall.args[0]).to.have.property('method').toBe('GET')
      })
    })

    describe('when the verb argument is not set', () => {
      const method = function (options, callback) {
        callback(null, { statusCode: 200, request: options })
      }
      const methodSpy = sinon.spy(method)
      beforeAll(done => {
        wrapper(methodSpy)({ url: 'http://www.example.com' })
          .then(() => done())
          .catch(() => done())
      })
      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(methodSpy.called).toBe(true)
        expect(methodSpy.callCount).toBe(1)
        expect(methodSpy.lastCall.args[0]).not.toHaveProperty('method')
      })
    })
  })

  describe('wrapped function arguments', () => {
    describe('arguments', () => {
      describe('when it is passed a uri and an options object', () => {
        let cb
        let uri
        const method = function (options, callback) {
          callback(null, { statusCode: 200, request: options })
        }
        const methodSpy = sinon.spy(method)
        beforeAll(done => {
          uri = 'http://example.com/'
          cb = sinon.spy()
          wrapper(methodSpy)(uri, { method: 'GET' }, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should set 'opts.url' to be the url argument`, () => {
          expect(methodSpy.called).toBe(true)
          expect(methodSpy.callCount).toBe(1)
          expect(methodSpy.lastCall.args[0]).to.have.property('url').toBe(uri)
        })
        it(`should call the provided callback`, () => {
          expect(cb.called).toBe(true)
        })
      })

      describe('when it is passed a uri and no options object', () => {
        let uri
        let cb
        const method = function (options, callback) {
          callback(null, { statusCode: 200, request: options })
        }
        const methodSpy = sinon.spy(method)
        beforeAll(done => {
          uri = 'http://example.com'
          cb = sinon.spy()
          wrapper(methodSpy, 'get')(uri, cb)
            .then(() => done())
            .catch(done)
        })
        it(
          `should create an options object, and set it's url property to be the passed uri`,
          () => {
            expect(methodSpy.called).toBe(true)
            expect(methodSpy.lastCall.args[0]).to.have.property('url').toBe(uri)
          }
        )
        it(`should call the provided callback`, () => {
          expect(cb.called).toBe(true)
        })
      })

      describe('when it is only passed an options object', () => {
        let opts
        let cb
        const method = function (options, callback) {
          callback(null, { statusCode: 200, request: options })
        }
        const methodSpy = sinon.spy(method)
        beforeAll(done => {
          opts = { url: 'http://example.com/' }
          cb = sinon.spy()
          wrapper(methodSpy, 'get')(opts, cb)
            .then(() => done())
            .catch(done)
        })
        it(
          `should pass the options object to the wrapped request method as it's first argument`,
          () => {
            expect(methodSpy.called).toBe(true)
            expect(methodSpy.lastCall.args[0]).toBe(opts)
          }
        )
        it(`should call the provided callback`, () => {
          expect(cb.called).toBe(true)
        })
      })
    })
  })
})
