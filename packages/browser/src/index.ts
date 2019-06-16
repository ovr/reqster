import {Client, ReqsterSettings, getDefaultClientSettings} from "@reqster/core";

const timeout = (ms: number, promise: Promise<any>) => new Promise(function(resolve, reject) {
    setTimeout(function() {
        reject(new Error('Timeout'))
    }, ms);

    promise.then(resolve, reject);
});

export function create(
    url: string,
    settings: Partial<ReqsterSettings>
): Client {
    return new Client(
        (url, settings) => {
            const request = fetch(url, settings);

            if (settings.timeout > 0) {
                timeout(settings.timeout, request);
            }

            return request;
        },
        url,
        {
            ...getDefaultClientSettings(),
            ...settings
        }
    );
}
