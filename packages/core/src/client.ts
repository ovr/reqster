import {
    InterceptorsManager,
    RequestInterceptor,
    ResponseInterceptor,
    ResponseInterceptorResultEnum
} from './interceptors';
import {BadResponse} from './errors';
import {serializeParams, SerializeParamsFn, transformResponse, TransformResponseFn} from "./helpers";
import {ReqsterResponse} from "./types";

export type ReqsterSettings = {
    headers: {
        [key: string]: string
    },
    timeout: number,
    serializeParams: SerializeParamsFn,
    transformResponse: TransformResponseFn,
    validateStatus: (status: number) => boolean,
};

export type ReqsterRequestSettings = Partial<ReqsterSettings> & {
    params?: {
        [key: string]: any
    },
};

export type ReqsterRequestDirectSettings = ReqsterRequestSettings & {
    method?: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT' | 'OPTIONS';
    data?: any
};


export class Client {
    public readonly interceptors = {
        request: new InterceptorsManager<RequestInterceptor>(),
        response: new InterceptorsManager<ResponseInterceptor>(),
    };

    constructor(
        protected executor: (url: string, settings: ReqsterSettings & ReqsterRequestDirectSettings) => Promise<ReqsterResponse>,
        protected url: string,
        protected settings: ReqsterSettings
    ) {}

    protected prepareUrl(endpoint: string, parameters?: { [key: string]: string } ): string {
        let url = this.url + endpoint;

        if (parameters) {
            const query = this.settings.serializeParams(parameters);
            if (query.length) {
                url += (url.indexOf('?') === -1 ? '?' : '&') + query;
            }
        }

        return url;
    }

    public async request<T = any>(endpoint: string, settings: ReqsterRequestDirectSettings): Promise<T> {
        const url =  this.prepareUrl(endpoint, settings.params);
        const parameters = {
            ...this.settings,
            ...settings,
            headers: {
                ...this.settings.headers,
                ...settings.headers
            },
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
            throw new BadResponse(
                'Unexpected status',
                {
                    url,
                    headers: parameters.headers,
                    method: <string>parameters.method,
                },
                {
                    ok: response.ok,
                    status: response.status,
                    headers: response.headers,
                    content: await response.clone().text()
                }
            );
        }

        return await this.settings.transformResponse(response, url, parameters);
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
        serializeParams,
        transformResponse,
        validateStatus: (status) => status >= 200 && status < 300
    };
}