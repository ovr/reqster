import {ResponseInterceptorResultEnum, InterceptorsManager, RequestInterceptor, ResponseInterceptor} from './interceptors';

export type ReqsterSettings = {
    headers: {
        [key: string]: string
    },
    timeout: number,
    serializeParams: (parameters: { [key: string]: any }) => string,
    transformResponse: (response: ReqsterResponse, endpoint: string) => Promise<any>,
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

export interface ReqsterResponseHeaders {
    get(name: string): string | null;
    has(name: string): boolean;
}

export interface ReqsterResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly headers: ReqsterResponseHeaders;

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

        return await this.settings.transformResponse(response, endpoint);
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

function serializeParams(parameters: { [key: string]: any }, path: string = ''): string {
    const result = [];

    for (const k in parameters) {
        if (parameters[k] !== null) {
            const value = parameters[k];

            if (Array.isArray(parameters[k])) {
                value.forEach((v: string) => {
                    result.push(encodeURIComponent(k) + '[]=' + encodeURIComponent(v));
                });
            } else if (typeof value === 'object') {
                result.push(serializeParams(value, k));
            } else {
                if (path) {
                    result.push(path + '[' + encodeURIComponent(k) + ']=' + encodeURIComponent(value));
                } else {
                    result.push(encodeURIComponent(k) + '=' + encodeURIComponent(value));
                }
            }
        }
    }

    return result.join('&');
}

export function getDefaultClientSettings(): ReqsterSettings {
    return {
        headers: {},
        timeout: 0,
        serializeParams,
        transformResponse: async (response: ReqsterResponse, endpoint: string) => {
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
        },
        validateStatus: (status) => status >= 200 && status < 300
    };
}

export {
    Client,
    ResponseInterceptorResultEnum
}
