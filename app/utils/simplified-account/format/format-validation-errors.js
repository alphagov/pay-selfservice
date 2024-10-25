const { kebabCase } = require('change-case')

module.exports = validationResult => {
  const errorSummary = validationResult.array().map(error => ({
    text: error.msg,
    href: `#${kebabCase(error.path)}`
  }))

  const formErrors = validationResult.array().reduce((acc, error) => {
    if (!acc[error.path]) {
      acc[error.path] = error.msg
    }
    return acc
  }, {})
  return {
    errorSummary,
    formErrors
  }
}
