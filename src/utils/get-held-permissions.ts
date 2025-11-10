const getHeldPermissions = (permissions: string[]) => {
  const permissionMap: Record<string, boolean> = {}
  if (permissions) {
    permissions.forEach((permission) => {
      permissionMap[permission.replace(/[-:]/g, '_')] = true
    })
  }
  return permissionMap
}

export = getHeldPermissions
