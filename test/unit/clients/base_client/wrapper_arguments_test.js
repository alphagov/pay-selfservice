'use strict'
const request = require('request')
const nock = require('nock')
const {expect} = require('chai')
const sinon = require('sinon')
const wrapper = require('../../../../app/services/clients/base_client/wrapper')

describe('wrapper: arguments handling', () => {
  afterEach(() => {
    nock.cleanAll()
  })
  describe('wrapper arguments', () => {
    describe('when the verb argument is set', () => {
      let method

      before(done => {
        nock('http://example.com').get('/').reply(200, 'success')
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
        nock('http://example.com').get('/').reply(200, 'success')
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
        let method, uri, cb

        before(done => {
          nock('http://example.com').get('/').reply(200, 'success')
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
        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
          expect(cb.lastCall.args[2]).to.equal('success')
        })
      })

      describe('when it is passed a uri and no options object', () => {
        let method, uri, cb

        before(done => {
          nock('http://example.com').get('/').reply(200, 'success')
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
        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
          expect(cb.lastCall.args[2]).to.equal('success')
        })
      })

      describe('when it only passed an options object', () => {
        let method, opts, cb

        before(done => {
          nock('http://example.com').get('/').reply(200, 'success')
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

        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
        })
      })
    })
  })
})
