import sinon from 'sinon'

export const inAnyOrder = (expected: any[]) => sinon.match(function (actual: any[]) {
  if (!(expected instanceof Array)) {
    return false
  }

  if (!(actual instanceof Array)) {
    return false
  }

  return expected.reduce((acc: boolean, curr) => {
    const contains = actual.some((el) => sinon.match(curr).test(el))
    if (!contains) {
      throw new Error('oh no')
    }
    return acc && contains
  }, true)
})
