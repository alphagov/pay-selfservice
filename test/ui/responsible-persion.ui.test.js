'use strict'

const { expect } = require('chai')
const cheerio = require('cheerio')
const { render } = require('../test-helpers/html-assertions')

describe('Stripe setup - responsible person view', () => {
  it('should display an error in summary for address line 1', done => {
    const templateData = {
      errors: { 'home-address-line-1': 'Inline error message' }
    }

    const body = render('stripe-setup/responsible-person/index', templateData)

    const $ = cheerio.load(body)
    expect($('.govuk-error-summary__list li').length).to.equal(1)
    expect($('.govuk-error-summary__list li a[href$="#home-address-line-1"]').text()).to.equal('Building name, number and street')

    done()
  })

  it('should display an error in summary for address line 2', done => {
    const templateData = {
      errors: { 'home-address-line-2': 'Inline error message' }
    }

    const body = render('stripe-setup/responsible-person/index', templateData)

    const $ = cheerio.load(body)
    expect($('.govuk-error-summary__list li').length).to.equal(1)
    expect($('.govuk-error-summary__list li a[href$="#home-address-line-2"]').text()).to.equal('Building name, number and street')

    done()
  })

  it('should only display single error in error summary if there is an error for both address lines', done => {
    const templateData = {
      errors: {
        'home-address-line-1': 'Inline error message',
        'home-address-line-2': 'Inline error message' }
    }

    const body = render('stripe-setup/responsible-person/index', templateData)

    const $ = cheerio.load(body)
    expect($('.govuk-error-summary__list li').length).to.equal(1)
    expect($('.govuk-error-summary__list li a[href$="#home-address-line-1"]').text()).to.equal('Building name, number and street')

    done()
  })
})
