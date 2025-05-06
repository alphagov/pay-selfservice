const urlJoin = (baseUrl: string, resourcePath: string) => {
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const cleanResource = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath
  return `${cleanBase}/${cleanResource}`
}

export = urlJoin
