'use strict'

const {expect} = require('chai')
const config = require('../../../../config/index')
// const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const {getApp} = require('../../../../server')
const {createAppWithSession} = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')

describe('Create a prototype link controller', () => {
  describe('when the details are submitted', () => {
    describe('and the link is created', () => {
      let product, response
      before(done => {
        product = productFixtures.validCreateProductRequest().getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products`).reply(200, product)

        supertest(createAppWithSession(getApp(), {}))
          .get(paths.prototyping.demoService.create)
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should respond with status code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should have a failed payment scenario title', () => {
        expect(response.headers.location).to.equal(paths.prototyping.demoService.confirm)
      })

    //   it('should describe how failed payments are handled in GOV.UK Pay with a link to the documentation', () => {
    //     expect($('p.scenario-description').text()).to.equal('If the payment fails, the user will see a GOV.UK Pay error page. This includes a link to return to your service where you should give them useful next steps.')
    //     const docsLink = $('a.scenario-docs-link')
    //     expect(docsLink.attr('href')).to.equal('https://govukpay-docs.cloudapps.digital#payment-flow-payment-fails')
    //     expect(docsLink.text()).to.equal('See what you should do after a failed payment in our documentation')
    //   })

    //   it('should show a picture of an example error page', () => {
    //     expect($('h2').text()).to.equal('This is an example error page')
    //     expect($('img.example-page').attr('src')).to.equal('./massive-fail.jpg')
    //   })

    //   it('should encourage the user to try a different card number', () => {
    //     expect($('p.try-a-different-card-number').text()).to.equal('Try a different card number to see a successful confirmation.')
    //     const differentCardNumbersLink = $('p.try-a-different-card-number a')
    //     expect(differentCardNumbersLink.text()).to.equal('Try a different card number')
    //     expect(differentCardNumbersLink.attr('href')).to.equal('https://govukpay-docs.cloudapps.digital#mock-card-numbers-for-testing-purposes')
    //   })

    //   it('should provide a link back to the transactions view in selfservice', () => {
    //     expect($('p.transactions-prompt').text()).to.equal('You can now view this payment in your transactions list on GOV.UK Pay.')
    //     const transactionsLink = $('a.transactions-link')
    //     expect(transactionsLink.text()).to.equal('Go to transactions')
    //     expect(transactionsLink.attr('href')).to.equal('selfservice/transactions')
    //   })
    // })
    })

  // describe('when a payment lookup fails', () => {
  //   let payment, response, $
  //   before(done => {
  //     payment = productFixtures.validCreatePaymentResponse().getPlain()
  //     nock(config.PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(404)

  //     supertest(getApp())
  //       .get(paths.confirm.demoPayment.replace(':paymentExternalId', payment.external_id))
  //       .end((err, res) => {
  //         response = res
  //         $ = cheerio.load(res.text || '')
  //         done(err)
  //       })
  //   })

  //   it('should respond with code returned from products endpoint', () => {
  //     expect(response.statusCode).to.equal(404)
  //   })
  //   it('should render error page', () => {
  //     expect($('.page-title').text()).to.equal('An error occurred:')
  //     expect($('#errorMsg').text()).to.equal('Sorry, we are unable to process your request')
  //   })
  })
})
