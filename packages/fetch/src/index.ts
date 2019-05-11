import {Client, ReqsterSettings, ReqsterRequestSettings} from "@reqster/core";

export function create(
    url: string,
    settings: ReqsterSettings
): Client {
    return new Client(
        (url: string, settings: ReqsterRequestSettings) => fetch(url, settings),
        url,
        settings
    );
}
