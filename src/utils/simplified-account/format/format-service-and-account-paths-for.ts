import paths from '@root/paths'
import urlJoin from '@utils/simplified-account/format/url'

function formatServiceAndAccountPathsFor(
  path: string,
  serviceExternalId: string,
  accountType: string,
  ...params: string[]
) {
  const completePath = urlJoin(paths.simplifiedAccount.root, path)
  return formattedPathFor(completePath, serviceExternalId, accountType, ...params)
}

const formattedPathFor = (path: string, ...pathParams: string[]) => {
  const paramNames = path.split('/').filter((segment) => segment.startsWith(':'))
  paramNames.forEach((paramName, index) => {
    if (pathParams[index]) {
      path = path.replace(paramName, encodeURIComponent(pathParams[index]))
    }
  })
  return path
}

export = formatServiceAndAccountPathsFor
