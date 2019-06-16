import https from 'https';
import http from 'http';

import {Client, ReqsterSettings} from "@reqster/core";
import {Response, ResponseHeaders} from "./response";

const isHttps = /https:?/;

export const create = (
    url: string,
    settings: ReqsterSettings
): Client => new Client(
    (url, settings) => new Promise(
        (resolve, reject) => {
            const agent = isHttps.test(url) ? https : http;

            const request = agent.request(url, {method: settings.method, headers: settings.headers}, (res) => {
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
                        new ResponseHeaders(<any>res.headers)
                    ));
                });
            });

            request.end();
        }
    ),
    url,
    settings
);
