declare module '@services/clients/public-auth.client' {
  export interface CreateTokenPayload {
    account_id: number;
    created_by: string;
    type: string;
    description: string;
    token_account_type: string;
    service_external_id: string;
    service_mode: string;
  }

  export interface CreateTokenParams {
    accountId: number;
    payload: CreateTokenPayload;
  }

  export function createTokenForAccount(params: CreateTokenParams): Promise<any>;
}
