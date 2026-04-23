import { setGlobalLocale } from '@utils/time/global-locale'
setGlobalLocale()

import { parseDateTime } from '@utils/time/parse-date-time'

const JANUARY_FIRST_2027 = '2027-01-01T00:00:00.000+00:00'
const JANUARY_FIRST_2027_NINE_SEVENTEEN_AM = '2027-01-01T09:17:00.000+00:00'

const JUNE_FIRST_2027_ONE_FORTY_TWO_PM = '2027-06-01T13:42:00.000+01:00'

describe('date and time parsing tests', () => {
  describe('Parsing Dates only', () => {
    it('should correctly parse a date if a time is not provided includeTime is false', () => {
      const parsed = parseDateTime('01/01/2027', '', false)
      parsed.should.not.be.null
      parsed.toISO()!.should.eq(JANUARY_FIRST_2027)
    })

    it('should correctly parse a date if a time is not provided and includeTime is true', () => {
      const parsed = parseDateTime('01/01/2027', '', true)
      parsed.should.not.be.null
      parsed.toISO()!.should.eq(JANUARY_FIRST_2027)
    })

    it('should correctly parse a date if a time is provided and includeTime is false', () => {
      const parsed = parseDateTime('01/01/2027', '09:17:00', false)
      parsed.should.not.be.null
      parsed.toISO()!.should.eq(JANUARY_FIRST_2027)
    })
  })

  describe('Parsing dates with GMT times', () => {
    it('should correctly parse a date with time during GMT', () => {
      const parsed = parseDateTime('01/01/2027', '9:17:00', true)
      parsed.should.not.be.null
      parsed.toISO()!.should.eq(JANUARY_FIRST_2027_NINE_SEVENTEEN_AM)
    })
  })

  describe('Parsing dates with BST times', () => {
    it('should correctly parse a date with time during BST', () => {
      const parsed = parseDateTime('01/06/2027', '13:42:00', true)
      parsed.should.not.be.null
      parsed.toISO()!.should.eq(JUNE_FIRST_2027_ONE_FORTY_TWO_PM)
    })
  })
})
