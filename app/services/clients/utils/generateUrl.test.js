'use strict'
const { generateUrl } = require('./generateUrl')

const { expect } = require('chai')

describe('URL Generator', () => {
  describe('URL Parameters', () => {
    it('should replace a variable in the template', async () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/{example}', {
        example: 'hello'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/hello')
    })
    it('should URL encode when replacing variables', async () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/{example}', {
        example: 'G&T'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/G%26T')
    })
    it('should use pluses to escape spaces', async () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/{example}', {
        example: 'abc def ghi'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/abc+def+ghi')
    })
    it('should replace multiple variables in the template', async () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/{exampleA}/{exampleB}/{exampleC}', {
        exampleA: 'this is a',
        exampleB: 'this is b',
        exampleC: 'this is c'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/this+is+a/this+is+b/this+is+c')
    })
    it('should error if required variables are missing', async () => {
      expect(() => {
        generateUrl('http://127.0.0.1:8080/v1/{exampleA}/{exampleB}/{exampleC}', {
          exampleA: 'this is a',
          exampleB: 'this is b'
        })
      }).to.throw('Missing required variable [exampleC] when preparing URL, template was [http://127.0.0.1:8080/v1/{exampleA}/{exampleB}/{exampleC}], parameters were [{"exampleA":"this is a","exampleB":"this is b"}]')
    })
    it('should list all missing when multiple variables are missing', async () => {
      expect(() => {
        generateUrl('https://example.com/{exampleA}/{exampleB}/{exampleC}', {
          exampleB: 'this is b'
        })
      }).to.throw('Missing required variables [exampleA, exampleC] when preparing URL, template was [https://example.com/{exampleA}/{exampleB}/{exampleC}], parameters were [{"exampleB":"this is b"}]')
    })
    it('should error if unknown variables are provided', async () => {
      expect(() => {
        generateUrl('https://example.com/{exampleA}', {
          exampleA: 'this is a',
          exampleB: 'this is b'
        })
      }).to.throw('Unexpected variable provided [exampleB] when preparing URL, template was [https://example.com/{exampleA}], parameters were [{"exampleA":"this is a","exampleB":"this is b"}]')
    })
    it('should prioritise informing about missing parameters over additional parameters', async () => {
      expect(() => {
        generateUrl('https://example.com/{exampleA}/{exampleB}', {
          exampleA: 'this is a',
          exampleC: 'this is c'
        })
      }).to.throw('Missing required variable [exampleB] when preparing URL, template was [https://example.com/{exampleA}/{exampleB}], parameters were [{"exampleA":"this is a","exampleC":"this is c"}]')
    })
  })
  describe('Query string', () => {
    it('should add a basic query string', () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/something', {}, {
        a: 'b',
        c: 'd'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/something?a=b&c=d')
    })
    it('should encode both keys and values in the query string', () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/something', {}, {
        'a&b': 'c&d'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/something?a%26b=c%26d')
    })
    it('should append the new query string to the templated querystring if both are present', () => {
      const result = generateUrl('http://127.0.0.1:8080/v1/something?hello={hello}', {
        hello: 'world'
      }, {
        abc: 'def'
      })

      expect(result).to.equal('http://127.0.0.1:8080/v1/something?hello=world&abc=def')
    })
  })
  it('should use strings for boolean values', () => {
    const result = generateUrl('/v1/something?hello={hello}&goodbye={goodbye}', {
      hello: true,
      goodbye: false
    }, {
      abc: false,
      def: true
    })

    expect(result).to.equal('/v1/something?hello=true&goodbye=false&abc=false&def=true')
  })
  it('should comma seperate arrays', () => {
    const result = generateUrl('/v1/something', {}, {
      abc: ['a', 'b', 'c']
    })

    expect(result).to.equal('/v1/something?abc=a%2Cb%2Cc')
  })
})
