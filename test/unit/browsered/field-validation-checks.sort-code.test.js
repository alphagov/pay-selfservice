'use strict'

const { isNotSortCode } = require('../../../app/browsered/field-validation-checks')

describe('isNotValidSortCode', () => {
  it('should validate successfully for 6 digits', () => {
    const sortCode = '108800'

    expect(isNotSortCode(sortCode)).toBe(false) // eslint-disable-line
  })

  it('should validate successfully for 6 digits with dashes', () => {
    const sortCode = '10-88-00'

    expect(isNotSortCode(sortCode)).toBe(false) // eslint-disable-line
  })

  it('should validate successfully for 6 digits with spaces', () => {
    const sortCode = '10 88 00'

    expect(isNotSortCode(sortCode)).toBe(false) // eslint-disable-line
  })

  it(
    'should validate successfully for 6 digits with mix of dashes and spaces',
    () => {
      const sortCode = '10-88 00'

      expect(isNotSortCode(sortCode)).toBe(false) // eslint-disable-line
    }
  )

  it(
    'should validate successfully for 6 digits with random whitespace',
    () => {
      const sortCode = '1 0 88 00'

      expect(isNotSortCode(sortCode)).toBe(false) // eslint-disable-line
    }
  )

  it('should be not valid when is not a number', () => {
    const sortCode = 'abcdef'

    expect(isNotSortCode(sortCode)).toBe('Enter a valid sort code like 309430')
  })

  it('should be not valid when is too short', () => {
    const sortCode = '12345'

    expect(isNotSortCode(sortCode)).toBe('Enter a valid sort code like 309430')
  })

  it('should be not valid when is too long', () => {
    const sortCode = '1234567'

    expect(isNotSortCode(sortCode)).toBe('Enter a valid sort code like 309430')
  })
})
