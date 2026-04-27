const { expect } = require('chai')
const formattedPathFor = require('@utils/simplified-account/format/format-paths-for')

describe('formattedPathFor', () => {
  describe('with a required parameter', () => {
    it('should replace a single param', () => {
      expect(formattedPathFor('/service/:serviceId', 'abc123')).to.equal('/service/abc123')
    })

    it('should replace multiple params', () => {
      expect(formattedPathFor('/service/:serviceId/account/:accountId', 'abc123', 'def456')).to.equal(
        '/service/abc123/account/def456'
      )
    })

    it('should encode special characters in params', () => {
      expect(formattedPathFor('/service/:serviceId', 'abc 123')).to.equal('/service/abc%20123')
    })
  })

  describe('with an Express 4 optional parameter (:param?)', () => {
    it('should replace the param when a value is provided', () => {
      expect(formattedPathFor('/transactions/:modeFilter?', 'live')).to.equal('/transactions/live')
    })

    it('should not replace a placeholder if no replacement is supplied', () => {
      expect(formattedPathFor('/transactions/:modeFilter?')).to.equal('/transactions')
    })
  })

  describe('with an Express 5 optional parameter ({/:param})', () => {
    it('should replace the param when a value is provided', () => {
      expect(formattedPathFor('/transactions{/:modeFilter}', 'live')).to.equal('/transactions/live')
    })

    it('should omit the segment when no value is provided', () => {
      expect(formattedPathFor('/transactions{/:modeFilter}')).to.equal('/transactions')
    })
  })

  describe('with no parameters', () => {
    it('should return the path unchanged', () => {
      expect(formattedPathFor('/transactions/nosearch')).to.equal('/transactions/nosearch')
    })
  })
})
