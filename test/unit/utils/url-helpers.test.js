const chai = require('chai')
const { parseUrlFromReq, getQueryStringForUrl } = require('../../../app/utils/url-helpers')

const expect = chai.expect

describe('URL Helper', function () {
  const req = {
    headers: {
      host: 'localhost:8000'
    },
    protocol: 'http',
    url: '/account/1111111/transactions?reference=123&email=email@address.co.uk&lastDigitsCardNumber=456&state=In+progress'
  }

  const parsedUrl = parseUrlFromReq(req)

  it('should parse an URL given a valid request', () => {
    expect(parsedUrl.origin).to.equal('http://localhost:8000')
    expect(parsedUrl.protocol).to.equal('http:')
    expect(parsedUrl.port).to.equal('8000')
    expect(parsedUrl.pathname).to.equal('/account/1111111/transactions')
    expect(parsedUrl.search).to.equal('?reference=123&email=email@address.co.uk&lastDigitsCardNumber=456&state=In+progress')
    expect(parsedUrl.href).to.equal('http://localhost:8000/account/1111111/transactions?reference=123&email=email@address.co.uk&lastDigitsCardNumber=456&state=In+progress')
  })

  it('should return query parameters for req (if any) with leading `?` removed', () => {
    const queryString = getQueryStringForUrl(parsedUrl)
    expect(queryString).to.equal('reference=123&email=email@address.co.uk&lastDigitsCardNumber=456&state=In+progress')
  })

  it('should return an empty string if search is empty', () => {
    delete req.url
    const parsedUrlNoQuery = parseUrlFromReq(req)
    const queryString = getQueryStringForUrl(parsedUrlNoQuery)
    expect(parsedUrlNoQuery.search).to.equal('')
    expect(queryString).to.equal('')
  })
})
