
export type QueryBag = {[key: string]: any};
export type HeadersBag = {[key: string]: string};

export type HeadersInit = Headers | string[][] | Record<string, string>;

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
