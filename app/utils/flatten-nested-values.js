'use strict'
function flattenNestedValues (target) {
  return Object.values(target).reduce((aggregate, value) => {
    const valueIsNestedObject = typeof value === 'object' && value !== null
    if (valueIsNestedObject) {
      return [ ...aggregate, ...flattenNestedValues(value) ]
    }
    return [ ...aggregate, value ]
  }, [])
}

module.exports = flattenNestedValues
