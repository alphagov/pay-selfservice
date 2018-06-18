'use strict'

// Local dependencies
const paths = require('../../paths')

module.exports = (req, res) => {
  req.flash('generic', `<h2>Thanks for your feedback</h2>`)
  return res.redirect(paths.feedback)
}
