import paths from '@root/paths'

function formatServiceAndAccountPathsFor(
  path: string,
  serviceExternalId: string,
  accountType: string,
  ...params: string[]
) {
  const rootPath = paths.simplifiedAccount.root
  const cleanRoot = rootPath.endsWith('/') ? rootPath.slice(0, -1) : rootPath
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  const completePath = `${cleanRoot}/${cleanPath}`
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
