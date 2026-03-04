interface UpdateServiceRoleRequest {
  role_name: string
}
export class UpdateServiceRoleRequestFixture {
  readonly roleName: string

  constructor(roleName?: string) {
    this.roleName = roleName ?? 'admin'
  }

  toRequest(): UpdateServiceRoleRequest {
    return {
      role_name: this.roleName,
    }
  }
}
