import paths from '@root/paths'
import urlJoin from '@utils/simplified-account/format/url'

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const formattedPathFor = (route: string, ...pathParams: (string | undefined)[]): string => {
  const paramNames = route.split('/').filter((segment) => segment.startsWith(':'))
  const encodedValues = pathParams.map((v) => (v === undefined ? undefined : encodeURIComponent(String(v))))

  return paramNames.reduce((currentRoute, paramName, index) => {
    const value = encodedValues[index]
    if (value === undefined) return currentRoute

    const nameWithoutColon = paramName.slice(1)
    const pattern = new RegExp(`:${escapeRegExp(nameWithoutColon)}(?=/|$)`, 'g')
    return currentRoute.replace(pattern, value)
  }, route)
}

function formatServiceAndAccountPathsFor(
  route: string,
  serviceExternalId: string,
  accountType: string,
  ...params: string[]
): string {
  const completePath = urlJoin(paths.simplifiedAccount.root, route)
  return formattedPathFor(completePath, serviceExternalId, accountType, ...params)
}

export default formatServiceAndAccountPathsFor

const maybeModule = typeof module !== 'undefined' ? (module as unknown as { exports?: unknown }) : undefined
if (maybeModule) {
  maybeModule.exports = Object.assign(formatServiceAndAccountPathsFor, {
    formattedPathFor,
    default: formatServiceAndAccountPathsFor,
  })
}
