'use strict'

const paths = require('../../paths')

function get (req, res) {
  res.redirect(paths.services.index)
}

module.exports = {
  get
}
