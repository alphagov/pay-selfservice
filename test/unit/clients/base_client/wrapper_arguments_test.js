'use strict'

// NPM Dependencies
const request = require('request')
const {expect} = require('chai')
const sinon = require('sinon')

// Local Dependencies
const wrapper = require('../../../../app/services/clients/base_client/wrapper')

describe('wrapper: arguments handling', () => {
  describe('wrapper arguments', () => {
    describe('when the verb argument is set', () => {
      let method

      before(done => {
        method = sinon.spy(request)
        wrapper(method, 'get')('http://www.example.com')
          .then(() => done())
          .catch(() => done())
      })

      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(method.called).to.equal(true)
        expect(method.callCount).to.equal(1)
        expect(method.lastCall.args[0]).to.have.property('method').to.equal('GET')
      })
    })

    describe('when the verb argument is not set', () => {
      let method

      before(done => {
        method = sinon.spy(request)
        wrapper(method)('http://www.example.com')
          .then(() => done())
          .catch(() => done())
      })

      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(method.called).to.equal(true)
        expect(method.callCount).to.equal(1)
        expect(method.lastCall.args[0]).not.to.have.property('method')
      })
    })
  })

  describe('wrapped function arguments', () => {
    describe('arguments', () => {
      describe('when it is passed a uri and an options object', () => {
        let method
        let uri
        let cb
        before(done => {
          uri = 'http://example.com/'
          cb = sinon.spy()
          method = sinon.spy(request)
          wrapper(method)(uri, {method: 'GET'}, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should set 'opts.uri' to be the url argument`, () => {
          expect(method.called).to.equal(true)
          expect(method.callCount).to.equal(1)
          expect(method.lastCall.args[0]).to.have.property('uri').to.equal(uri)
        })
        it(`should call the provided callback`, () => {
          expect(cb.called).to.equal(true)
        })
      })
      describe('when it is passed a uri and no options object', () => {
        let method
        let uri
        let cb
        before(done => {
          uri = 'http://example.com'
          cb = sinon.spy()
          method = sinon.spy(request)
          wrapper(method, 'get')(uri, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should create an options object, and set it's uri property to be the passed uri`, () => {
          expect(method.called).to.equal(true)
          expect(method.lastCall.args[0]).to.have.property('uri').to.equal(uri)
        })
        it(`should call the provided callback`, () => {
          expect(cb.called).to.equal(true)
        })
      })
      describe('when it is only passed an options object', () => {
        let method
        let opts
        let cb
        before(done => {
          opts = {uri: 'http://example.com/'}
          cb = sinon.spy()
          method = sinon.spy(request)
          wrapper(method, 'get')(opts, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should pass the options object to the wrapped request method as it's first argument`, () => {
          expect(method.called).to.equal(true)
          expect(method.lastCall.args[0]).to.equal(opts)
        })
        it(`should call the provided callback`, () => {
          expect(cb.called).to.equal(true)
        })
      })
    })
  })
})
