import {ResponseInterceptorResultEnum, InterceptorsManager, RequestInterceptor, ResponseInterceptor} from './interceptors';

export interface ReqsterRequestSettings {
    method?: string;
    data?: any
}

export type ReqsterSettings = {
    headers: {
        [key: string]: string
    },
    timeout: number,
    validateStatus: (status: number) => boolean,
};

export interface ReqsterResponse {
    ok: boolean;
    status: number;

    clone(): ReqsterResponse;
    json(): Promise<any>;
    text(): Promise<string>;
}

class Client {
    public readonly interceptors = {
        request: new InterceptorsManager<RequestInterceptor>(),
        response: new InterceptorsManager<ResponseInterceptor>(),
    };

    constructor(
        protected executor: (url: string, settings: ReqsterSettings & ReqsterRequestSettings) => Promise<ReqsterResponse>,
        protected url: string,
        protected settings: ReqsterSettings
    ) {}

    protected prepareUrl(endpoint: string): string {
        return this.url + endpoint;
    }

    public async request<T = any>(endpoint: string, settings: ReqsterRequestSettings): Promise<T> {
        const url =  this.prepareUrl(endpoint);
        const parameters = {
            ...this.settings,
            ...settings,
            body: settings.data ? JSON.stringify(settings.data) : undefined,
        };

        for (const before of this.interceptors.request.interceptors) {
            await before(url, parameters);
        }

        const response = await this.executor(url, parameters);

        for (const after of this.interceptors.response.interceptors) {
            const middlewareResult = await after(url, parameters, response);
            if (middlewareResult === ResponseInterceptorResultEnum.RETRY) {
                return this.request(endpoint, settings);
            }
        }

        if (!response.ok || !this.settings.validateStatus(response.status)) {
            throw {
                status: response.status,
                endpoint,
                message: 'Unexpected status',
                response: await response.clone().text()
            };
        }

        try  {
            return await response.clone().json()
        } catch (e) {
            throw {
                status: -1,
                endpoint,
                message: 'Bad JSON',
                response: await response.clone().text()
            };
        }
    }

    public async post<D = any, T = any>(endpoint: string, data?: D, settings?: ReqsterRequestSettings): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            data,
            ...settings
        });
    }

    public async get<T = any>(endpoint: string, settings?: ReqsterRequestSettings): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
            ...settings
        });
    }

    public async put<D = any, T = any>(endpoint: string, data?: D, settings?: ReqsterRequestSettings): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            data,
            ...settings
        });
    }

    public async patch<D = any, T = any>(endpoint: string, data?: D, settings?: ReqsterRequestSettings): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            data,
            ...settings
        });
    }

    public async delete<T = any>(endpoint: string, settings?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            ...settings
        });
    }
}

export function getDefaultClientSettings(): ReqsterSettings {
    return {
        headers: {},
        timeout: 0,
        validateStatus: (status) => status >= 200 && status < 300
    };
}

export {
    Client,
    ResponseInterceptorResultEnum
}
