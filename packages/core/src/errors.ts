import {HeadersBag} from "./types";

interface RequestDebugInformation {
    readonly url: string;
    readonly headers: HeadersBag;
    readonly method: string;
}

interface ResponseDebugInformation {
    readonly ok: boolean;
    readonly status: number;
    readonly headers: HeadersBag;
    readonly content: string;
}

export abstract class HttpError extends Error {
    constructor(
        message: string,
        public request: RequestDebugInformation,
        public response: ResponseDebugInformation|null,
    ) {
        super(message);
    }
}

export class BadResponse extends HttpError {}

export class TimeoutError extends HttpError {}
