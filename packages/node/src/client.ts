import https from 'https';
import http, {ClientRequestArgs} from 'http';

import {Client, getDefaultClientSettings, ReqsterSettings} from "@reqster/core";
import {Response, ResponseHeaders} from "./response";

const isHttps = /https:?/;

export type ReqsterNodeSettings = ReqsterSettings & {
    socketPath: null,
};

export const create = (
    url: string,
    settings: Partial<ReqsterSettings>
): Client => new Client(
    (url, settings: any) => new Promise(
        (resolve, reject) => {
            const agent = isHttps.test(url) ? https : http;

            let options: ClientRequestArgs = {
                method: settings.method,
                headers: settings.headers
            };

            if (settings.timeout > 0) {
                options.timeout = settings.timeout;
            }

            const request = agent.request(url, options, (res) => {
                let body = '';

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('error', (e) => {
                    reject(e);
                });

                res.on('end', () => {
                    resolve(
                        new Response(
                            true,
                            res.statusCode || 0,
                            body,
                            new ResponseHeaders(<any>res.headers)
                        )
                    );
                });
            });

            request.end();
        }
    ),
    url,
    {
        ...getDefaultClientSettings(),
        ...settings
    }
);
