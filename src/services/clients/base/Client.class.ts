// @ts-expect-error js commons is not updated for typescript support yet
import { Client } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client'
import { AxiosResponse } from 'axios'
import { configureClient } from '@services/clients/base/config'

export default interface IClient {
  configure: (baseUrl: string, options: object) => void
  get: <ResponseDataType>(url: string, description: string) => Promise<AxiosResponse<ResponseDataType>>
  post: <ResponseDataType, PayloadType>(
    url: string,
    data: PayloadType,
    description: string
  ) => Promise<AxiosResponse<ResponseDataType>>
  patch: <ResponseDataType, PayloadType>(
    url: string,
    data: PayloadType,
    description: string
  ) => Promise<AxiosResponse<ResponseDataType>>
  delete: <ResponseDataType>(url: string, description: string) => Promise<AxiosResponse<ResponseDataType>>
}

export abstract class BaseClient {
  protected readonly client: IClient

  protected constructor(baseUrl: string, serviceName: string) {
    if (!baseUrl) {
      throw new Error('baseUrl is required')
    }
    if (!serviceName) {
      throw new Error('serviceName is required')
    }

    // js commons is not updated for typescript support yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    this.client = new Client(serviceName)
    configureClient(this.client, baseUrl) // this only ever needs to be called once for a specific client
  }

  protected async get<ResponseDataType>(
    resourcePath: string,
    description: string
  ): Promise<AxiosResponse<ResponseDataType>> {
    return await this.client.get(resourcePath, description)
  }

  protected async post<PayloadType, ResponseDataType>(
    resourcePath: string,
    data: PayloadType,
    description: string
  ): Promise<AxiosResponse<ResponseDataType>> {
    return await this.client.post(resourcePath, data, description)
  }

  protected async patch<PayloadType, ResponseDataType>(
    resourcePath: string,
    data: PayloadType,
    description: string
  ): Promise<AxiosResponse<ResponseDataType>> {
    return await this.client.patch(resourcePath, data, description)
  }

  protected async delete<ResponseDataType>(resourcePath: string, description: string): Promise<AxiosResponse<ResponseDataType>> {
    return await this.client.delete(resourcePath, description)
  }
}
