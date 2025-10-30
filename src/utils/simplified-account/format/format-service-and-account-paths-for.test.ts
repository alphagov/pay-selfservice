import { expect } from 'chai'
import { describe, it } from 'mocha'
import formatServiceAndAccountPathsFor, { formattedPathFor } from './format-service-and-account-paths-for'

describe('format-service-and-account-paths-for utils tests', () => {
  it('replaces named params with encoded values, space, special char and end-of-string placeholders', () => {
    const route = '/service/:serviceId/account/:accountType/details/:id'
    const result = formattedPathFor(route, 's e', '1', '@id#')
    expect(result).to.equal(
      `/service/${encodeURIComponent('s e')}/account/${encodeURIComponent('1')}/details/${encodeURIComponent('@id#')}`
    )
  })

  it('skips undefined params and leaves placeholder', () => {
    const route = '/x/:a/:b'
    const result = formattedPathFor(route, 'one', undefined)
    expect(result).to.equal(`/x/${encodeURIComponent('one')}/:b`)
  })

  it('does not replace partial or similarly named params', () => {
    const route = '/:id/:id_long'
    const result = formattedPathFor(route, 'A', 'BBBBBBB')
    expect(result).to.equal(`/${encodeURIComponent('A')}/${encodeURIComponent('BBBBBBB')}`)
  })

  it('leaves route unchanged when there are no placeholders', () => {
    const route = '/static/path'
    const result = formattedPathFor(route, 'unused')
    expect(result).to.equal(route)
  })

  it('handles trailing slash', () => {
    const routeWithTrailing = '/prefix/:param/'
    const resultTrailing = formattedPathFor(routeWithTrailing, 'value')
    expect(resultTrailing).to.equal(`/prefix/${encodeURIComponent('value')}/`)
  })

  it('formatServiceAndAccountPathsFor composes with serviceExternalId and accountType', () => {
    const route = '/route/:serviceId/:accountType'
    const externalServiceId = 'd7df78dfge978dfgg789hvjdrtji65'
    const accountType = 'test'
    const composed = formatServiceAndAccountPathsFor(route, externalServiceId, accountType)
    expect(composed).to.include(`/${encodeURIComponent(externalServiceId)}`)
    expect(composed).to.include(`/${encodeURIComponent(accountType)}`)
  })
})
