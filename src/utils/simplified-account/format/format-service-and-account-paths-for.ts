import paths from '@root/paths'
import urlJoin from '@utils/simplified-account/format/url'

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const formattedPathFor = (route: string, ...pathParams: (string | undefined)[]): string => {
  const paramNames = route
    .split('/')
    .filter((segment) => segment.startsWith(':'))
    .map((segment) => segment.slice(1)) // remove leading ':'

  const encodedValues = pathParams.map((v) => (v === undefined ? undefined : encodeURIComponent(String(v))))

  return paramNames.reduce((currentRoute, paramName, index) => {
    const value = encodedValues[index]
    if (value === undefined) return currentRoute

    const pattern = new RegExp(`:${escapeRegExp(paramName)}(?=/|$)`, 'g')
    return currentRoute.replace(pattern, value)
  }, route)
}

const formatServiceAndAccountPathsFor = (
  route: string,
  serviceExternalId: string,
  accountType: string,
  ...params: string[]
): string => {
  const completePath = urlJoin(paths.simplifiedAccount.root, route)
  return formattedPathFor(completePath, serviceExternalId, accountType, ...params)
}

export default formatServiceAndAccountPathsFor
