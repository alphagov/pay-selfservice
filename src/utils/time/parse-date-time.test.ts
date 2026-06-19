import { parseTransactionSearchDateTime } from '@utils/time/parse-date-time'
import { expect } from 'chai'
import { TimeConstants } from '@utils/time/time-constants'
import { DateTime } from 'luxon'

const JANUARY_FIRST_2027 = '2027-01-01T00:00:00.000Z'
const JANUARY_FIRST_2027_NINE_SEVENTEEN_AM = '2027-01-01T09:17:00.000Z'

const JUNE_FIRST_2027_ONE_FORTY_TWO_PM = '2027-06-01T12:42:00.000Z' // during BST, so UTC is one hour behind

describe('date and time parsing tests', () => {
  describe('transactions search date/time parsing', () => {
    describe('Parsing Dates only', () => {
      it('should correctly parse a date if a time is not provided includeTime is false', () => {
        const parsed = parseTransactionSearchDateTime('01/01/2027', '', false, TimeConstants.NOW)
        parsed.should.not.be.null
        parsed.toUTC().toISO().should.eq(JANUARY_FIRST_2027)
      })

      it('should correctly parse a date if a time is not provided and includeTime is true', () => {
        const parsed = parseTransactionSearchDateTime('01/01/2027', '', true, TimeConstants.NOW)
        parsed.should.not.be.null
        parsed.toUTC().toISO().should.eq(JANUARY_FIRST_2027)
      })

      it('should correctly parse a date if a time is provided and includeTime is false', () => {
        const parsed = parseTransactionSearchDateTime('01/01/2027', '09:17:00', false, TimeConstants.NOW)
        parsed.should.not.be.null
        parsed.toUTC().toISO().should.eq(JANUARY_FIRST_2027)
      })
    })

    describe('parsing dates with times', () => {
      describe('Parsing dates with GMT times', () => {
        it('should correctly parse a date with time during GMT', () => {
          const parsed = parseTransactionSearchDateTime('01/01/2027', '9:17:00', true, TimeConstants.NOW)
          parsed.should.not.be.null
          parsed.toUTC().toISO().should.eq(JANUARY_FIRST_2027_NINE_SEVENTEEN_AM)
        })
      })

      describe('Parsing dates with BST times', () => {
        it('should correctly parse a date with time during BST', () => {
          const parsed = parseTransactionSearchDateTime('01/06/2027', '13:42:00', true, TimeConstants.NOW)
          parsed.should.not.be.null
          parsed.toUTC().toISO().should.eq(JUNE_FIRST_2027_ONE_FORTY_TWO_PM)
        })
      })
    })

    describe('parsing invalid dates and times', () => {
      describe('for an invalid date', () => {
        it('should return the passed default time', () => {
          const defaultTime = DateTime.fromISO('2025-09-12T11:47:32.980+01:00') as DateTime<true>

          const parsed = parseTransactionSearchDateTime('notadate', '13:42:00', false, defaultTime)
          parsed.should.not.be.null
          parsed.isValid.should.be.true
          expect(parsed.toISO()).to.equal('2025-09-12T11:47:32.980+01:00')
        })
      })

      describe('for an invalid time', () => {
        it('should return a DateTime with isValid false', () => {
          const defaultTime = DateTime.fromISO('2025-09-12T11:47:32.980+01:00') as DateTime<true>

          const parsed = parseTransactionSearchDateTime('01/06/2027', 'notatime', true, defaultTime)
          parsed.should.not.be.null
          parsed.isValid.should.be.true
          expect(parsed.toISO()).to.equal('2025-09-12T11:47:32.980+01:00')
        })
      })
    })
  })
})
