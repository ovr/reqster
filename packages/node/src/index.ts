import {Client, ReqsterResponse, ReqsterSettings, ReqsterRequestSettings} from "@reqster/core";
import https from 'https';

class Response implements ReqsterResponse {
    public constructor(
        public ok: boolean,
        public status: number,
        public body: string,
    ) {}

    public clone() {
        return this;
    }

    public async text(): Promise<string> {
        throw new Error('Unimplemented');
    }

    public async json(): Promise<any> {
        throw new Error('Unimplemented');
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
                            body
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
