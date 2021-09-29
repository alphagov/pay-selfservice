import globalAxios, {AxiosPromise, AxiosInstance, AxiosResponse, Method} from 'axios';

import {User} from '../types/adminusers';
import {camelizeKeys, decamelizeKeys} from 'humps';

export class Client {

    findByExternalId(userExternalId: string, options?: any): Promise<User> {
        const localVarPath = `${process.env.ADMINUSERS_URL}/v1/api/users/{userExternalId}`
            .replace(`{${"userExternalId"}}`, encodeURIComponent(String(userExternalId)));

        const axiosRequestArgs = {
            url: localVarPath,
            method: 'GET' as Method,
            transformResponse: [].concat(
                globalAxios.defaults.transformResponse,
                (data: any) => {
                    return camelizeKeys(data);
                },
            )
        };

        return globalAxios.request<User>(axiosRequestArgs)
            .then((response: AxiosResponse) => {
                if (response.status >= 200 && response.status < 300) {
                    return Object.assign(new User, response.data)
                }
                throw new Error(response.status.toString());
            })
            .catch(({response}) => {
                throw new Error(response.status);
            })
    }
}
