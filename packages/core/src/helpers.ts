import {BadResponse} from "./errors";
import {ReqsterRequestDirectSettings, ReqsterResponse} from "./index";

export type SerializeParamsFn = (parameters: { [key: string]: any }) => string;
export type TransformResponseFn = (response: ReqsterResponse, url: string, settings: ReqsterRequestDirectSettings) => Promise<any>;

export const serializeParams = (parameters: { [key: string]: any }, path: string = ''): string => {
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
                headers: <{[key: string]: any}>parameters.headers,
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
};
