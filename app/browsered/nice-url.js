'use strict'

const removeDefinateArticles = require('../utils/nunjucks-filters/remove-definate-articles')

module.exports = () => {
  const inputs = Array.prototype.slice.call(document.querySelectorAll('[data-slugify]'))

  inputs.forEach(input => {
    input.addEventListener('input', niceURL, false)
  })

  function niceURL (e) {
    const input = e.target
    // stripping out the (in)definite article (the/a/an) and replacing spaces and other chars with a hyphen
    input.value = removeDefinateArticles(input.value).replace(/[\s£&$*_+~.()'"!:@]+/g, '-').toLowerCase()
  }
}
