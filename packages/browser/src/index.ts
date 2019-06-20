import {Client, ReqsterSettings, getDefaultClientSettings, TimeoutError} from "@reqster/core";

const timeout = (ms: number, promise: Promise<any>, e: TimeoutError) => new Promise(function(resolve, reject) {
    setTimeout(function() {
        reject(e)
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
                timeout(
                    settings.timeout,
                    request,
                    new TimeoutError(
                        `Timeout reached after ${settings.timeout} ms`,
                        {
                            url,
                            headers: settings.headers,
                            method: <string>settings.method,
                        },
                        null
                    )
                );
            }

            return <any>request;
        },
        url,
        {
            ...getDefaultClientSettings(),
            ...settings
        }
    );
}
