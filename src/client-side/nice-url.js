import removeIndefiniteArticles from '@govuk-pay/pay-js-commons/lib/nunjucks-filters/remove-indefinite-articles'

const initNiceUrl = () => {
  const inputs = Array.prototype.slice.call(document.querySelectorAll('[data-slugify]'))

  inputs.forEach(input => {
    input.addEventListener('input', niceUrl, false)
  })
}

const niceUrl = (e) => {
  const input = e.target
  // stripping out the (in)definite article (the/a/an) and replacing spaces and other chars with a hyphen
  input.value = removeIndefiniteArticles(input.value).replace(/[\s£&$*_+~.()'"!:@]+/g, '-').toLowerCase()
}

export default initNiceUrl
