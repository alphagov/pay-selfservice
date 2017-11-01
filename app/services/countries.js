'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
let countries = require('../data/countries.json')
const extensions = require('../data/country-record-extension.json')

// Exports
exports.retrieveCountries = (selectedCountry) => {
  let countriesList = lodash.clone(countries)
  countriesList.forEach(country => {
    country.entry.selected = country.entry.country === (selectedCountry || 'GB')
  })
  return countriesList
}

exports.translateAlpha2 = alpha2Code => countries.find(country => country.entry.country === alpha2Code).entry.name

// Merge the additional data into the register data
countries.forEach((country, i) => {
  const extension = extensions.find(item => item.country === item.country)
  if (extension) {
    country.entry.aliases = extension.aliases
    country.entry.weighting = extension.weighting
  }
})

countries = lodash.compact(countries)
countries = lodash.sortBy(countries, country => country.entry.name.toLowerCase())
