const path = require('path')
const expect = require('chai').expect
const countries = require(path.join(__dirname, '/../../../app/services/countries.js'))

describe('countries', function () {
  it('should list of countries ordered', function () {
    let retrievedCountries = countries.retrieveCountries()

    expect(retrievedCountries[0].entry.country).to.eql('AF')
    expect(retrievedCountries[1].entry.country).to.eql('AL')
  })

  it('should translate country code to name', function () {
    expect(countries.translateAlpha2('GB')).to.eql('United Kingdom')
  })
  it('should select only the correct country', function () {
    let retrievedCountries = countries.retrieveCountries('CH')
    let selectedCountries = retrievedCountries.filter(country => country.entry.selected === true)
    expect(selectedCountries.length).to.be.eql(1)
    expect(selectedCountries[0].entry.country).to.eql('CH')
  })
  it('should select GB by default', function () {
    let retrievedCountries = countries.retrieveCountries()
    let selectedCountries = retrievedCountries.filter(country => country.entry.selected === true)
    expect(selectedCountries.length).to.be.eql(1)
    expect(selectedCountries[0].entry.country).to.eql('GB')
  })
})
