'use strict'

const paths = require('@root/paths')

function get (req, res) {
  res.redirect(paths.serviceSwitcher.index)
}

module.exports = {
  get
}
