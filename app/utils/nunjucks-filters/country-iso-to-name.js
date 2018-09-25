'use strict'

const {translateAlpha2} = require('../../services/countries')

module.exports = iso => {
  return translateAlpha2(iso)
}
