import {Client, ReqsterResponse, ReqsterSettings, ReqsterRequestSettings, ReqsterResponseHeaders} from "@reqster/core";
import https from 'https';

class ResponseHeaders implements ReqsterResponseHeaders {
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

class Response implements ReqsterResponse {
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

export function create(
    url: string,
    settings: ReqsterSettings
): Client {
    return new Client(
        (url: string, settings: ReqsterRequestSettings) => new Promise<ReqsterResponse>(
            (resolve, reject) => {
                const request = https.request(url, settings, (res) => {
                    let body = '';

                    res.on('data', (chunk) => {
                        body += chunk;
                    });

                    res.on('error', (e) => {
                        reject(e);
                    });

                    res.on('end', () => {
                        resolve(new Response(
                            true,
                            res.statusCode || 0,
                            body,
                            new ResponseHeaders({})
                        ));
                    });
                });

                request.end();
            }
        ),
        url,
        settings
    );
}
