import sinon from 'sinon'

export const inAnyOrder = <T extends object>(expected: T[]) =>
  sinon.match(function (actual: T[]) {
    if (!(expected instanceof Array)) {
      return false
    }

    if (!(actual instanceof Array)) {
      return false
    }

    return expected.reduce((acc: boolean, curr) => {
      const contains = actual.some((el) => sinon.match(curr).test(el))
      return acc && contains
    }, true)
  })
