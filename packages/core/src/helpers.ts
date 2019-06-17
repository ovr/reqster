import {BadResponse} from "./errors";
import {HeadersBag, QueryBag, ReqsterRequestDirectSettings, ReqsterResponse} from "./index";

export type SerializeParamsFn = (parameters: QueryBag) => string;
export type TransformResponseFn = (response: ReqsterResponse, url: string, settings: ReqsterRequestDirectSettings) => Promise<any>;
export type TransformRequestFn = (data: any, headers: HeadersBag) => any;

export const serializeParams = (parameters: QueryBag, path: string = ''): string => {
    const result = [];

    for (const k in parameters) {
        if (parameters[k] !== null) {
            const value = parameters[k];

            if (Array.isArray(parameters[k])) {
                value.forEach((v: string) => {
                    result.push(encodeURIComponent(k) + '[]=' + encodeURIComponent(v));
                });
            } else if (typeof value === 'object') {
                if (path) {
                    result.push(serializeParams(value, path + '[' + k + ']'));
                } else {
                    result.push(serializeParams(value, path + k));
                }
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
};

export const transformResponse: TransformResponseFn = async (response, url, parameters) => {
    try  {
        return await response.clone().json()
    } catch (e) {
        throw new BadResponse(
            'Bad JSON',
            {
                url,
                headers: <HeadersBag>parameters.headers,
                method: <string>parameters.method,
            },
            {
                ok: response.ok,
                status: response.status,
                headers: response.headers.all(),
                content: await response.clone().text()
            }
        );
    }
};

function setHeaderIfUnset(headers: HeadersBag, key: string, value: string) {
    if (!headers.hasOwnProperty(headers[key])) {
        headers[key] = value;
    }
}

export const transformRequest: TransformRequestFn = (data, headers) => {
    if (data) {
        setHeaderIfUnset(headers, 'Content-Type', 'application/json;charset=utf-8');
        return JSON.stringify(data);
    }

    return data;
};
