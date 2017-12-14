'use strict'

const {expect} = require('chai')
const dateTimeFilter = require('./datetime')

describe('When an ISO timestring is passed through the  Nunjucks date/time filter', () => {
  const isoDateString = '2017-12-11T17:15:47Z'

  it('it should output a full human readable date time', () => {
    expect(dateTimeFilter(isoDateString, 'full')).to.equal('11 December 2017 5:15:47pm GMT')
  })
  it('it should output a human readable date', () => {
    expect(dateTimeFilter(isoDateString, 'date')).to.equal('11/12/2017')
  })
  it('it should output a human readable time', () => {
    expect(dateTimeFilter(isoDateString, 'time')).to.equal('17:15:47')
  })
})
