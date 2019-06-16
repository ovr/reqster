import {ReqsterResponse, ReqsterResponseHeaders} from "@reqster/core";

export class ResponseHeaders implements ReqsterResponseHeaders {
    constructor(
        protected readonly headers: {[key: string]: string}
    ) {}

    get(name: string): string | null {
        return this.headers[name];
    }

    has(name: string): boolean {
        return this.headers.hasOwnProperty(name);
    }
}

export class Response implements ReqsterResponse {
    public constructor(
        public ok: boolean,
        public status: number,
        public body: string,
        public headers: ResponseHeaders
    ) {}

    public clone() {
        return this;
    }

    public async text(): Promise<string> {
        return this.body;
    }

    public async json(): Promise<any> {
        return JSON.parse(this.body);
    }
}
