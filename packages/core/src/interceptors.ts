import {ReqsterResponse, ReqsterRequestSettings} from "./index";

export type RequestInterceptor = (endpoint: string, settings: ReqsterRequestSettings) => Promise<void>;
export type ResponseInterceptor = (endpoint: string, settings: ReqsterRequestSettings, response: ReqsterResponse) => Promise<ResponseInterceptorResultEnum>;

export enum ResponseInterceptorResultEnum {
    NOTHING = 0,
    RETRY = 1,
}

export class InterceptorsManager<T> {
    public readonly interceptors: T[] = [];

    public use(interceptor: T): number {
        return this.interceptors.push(interceptor);
    }
}
