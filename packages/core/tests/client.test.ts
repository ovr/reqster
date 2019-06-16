import {assert, expect} from 'chai';
import {
    Client,
    getDefaultClientSettings,
    ReqsterRequestDirectSettings,
    ReqsterResponse,
    ReqsterResponseHeaders,
    ReqsterSettings,
} from "../src";
import {serializeParams} from "../src/helpers";

class FakeResponseHeaders implements ReqsterResponseHeaders {
    get(name: string): string | null {
        return null;
    }

    has(name: string): boolean {
        return false;
    }
}

class FakeResponse implements ReqsterResponse {
    public readonly ok: boolean = true;
    public readonly headers: ReqsterResponseHeaders = new FakeResponseHeaders();

    public constructor(
        public status: number,
        public content: string = ''
    ) {}

    public clone(): ReqsterResponse {
        return this;
    }

    public async text() {
        return this.content;
    }

    public async json() {
        return JSON.parse(this.content);
    }
}

type Executor = (url: string, settings: ReqsterSettings & ReqsterRequestDirectSettings) => Promise<ReqsterResponse>;

function createTestClient(executor: Executor) {
    return new Client(
        executor,
        'http://localhost',
        {
            ...getDefaultClientSettings(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': 'en',
            },
            timeout: 5 * 1000,
            transformResponse: async (response, endpoint) => response
        }
    )
}

interface SerializeParamsData {
    params: any;
    expected: string;
}

describe('serializeParams', function() {
    it(`should assert`, () => {
        const serializeParamsDataProvider: SerializeParamsData[] = [
            {
                params: {},
                expected: ''
            },
            {
                params: {
                    t: true,
                    f: false,
                    s: 'str',
                    a: ['TRANSFER', 'BANK_IN']
                },
                expected: 't=true&f=false&s=str&a[]=TRANSFER&a[]=BANK_IN'
            },
            {
                params: {
                    filter: {
                        type: 'TRANSFER'
                    }
                },
                expected: 'filter[type]=TRANSFER'
            },
            {
                params: {
                    filter: {
                        type: ['TRANSFER', 'BANK_IN']
                    }
                },
                expected: 'type[]=TRANSFER&type[]=BANK_IN'
            },
            {
                params: {
                    filter: {
                        amount: {
                            lte: 5
                        }
                    }
                },
                expected: 'filter[amount][lte]=5'
            },
        ];

        for (const input of serializeParamsDataProvider) {
            assert.equal(serializeParams(input.params), input.expected);
        }
    });
});

describe('Client', function() {
    it('Simple request', async function() {
        const client = createTestClient(async () => new FakeResponse(200));

        const response = await client.request('/v1/user', {
            method: 'GET'
        });
    });

    it('Simple request (test headers and settings override)', async function() {
        const client = createTestClient(async (url, settings) => {
            assert.equal(settings.timeout, -5);
            assert.deepEqual(settings.headers, {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': 'en',
                'X-Sign': 'ZnNkZjMyNDIzNDNkZnNkZg=='

            });

            return new FakeResponse(200);
        });

        const response = await client.request('/v1/user', {
            method: 'GET',
            timeout: -5,
            headers: {
                'X-Sign': 'ZnNkZjMyNDIzNDNkZnNkZg=='
            }
        });
    });

    it('Simple GET without params', async function() {
        const client = createTestClient(async (url, settings) => {
            assert.equal(url, 'http://localhost/v1/user');
            assert.equal(settings.method, 'GET');

            return new FakeResponse(200);
        });

        const response = await client.get('/v1/user', {});
        assert.equal(response.status, 200);
    });

    it('Simple GET with params', async function() {
        const client = createTestClient(async (url, settings) => {
            assert.equal(url, 'http://localhost/v1/user?str=tsc&bool=true&case[]=SEND&case[]=RECEIVED&sort[created]=-1');
            assert.equal(settings.method, 'GET');

            return new FakeResponse(200);
        });

        const response = await client.get('/v1/user', {
            params: {
                str: 'tsc',
                bool: true,
                case: [
                    'SEND',
                    'RECEIVED'
                ],
                sort: {
                    created: -1
                },
            }
        });
        assert.equal(response.status, 200);
    });

    it('Simple POST', async function() {
        const client = createTestClient(async (url, settings) => {
            assert.equal(url, 'http://localhost/v1/user');
            assert.equal(settings.method, 'POST');
            assert.equal((<any>settings).body, '{"field":true}');

            return new FakeResponse(200);
        });

        const response = await client.post('/v1/user', {
            field: true
        });
        assert.equal(response.status, 200);
    });

    it('Testing BadResponse on "Unexpected status"', async function() {
        const client = createTestClient(async (url, settings) => {
            return new FakeResponse(555, 'BAD JSON, HEHEHEHE');
        });

        let thrown = false;

        try {
            await client.get('/v1/user');
        } catch (err) {
            thrown = true;

            assert.equal(err.message, 'Unexpected status');
        } finally {
            assert.equal(thrown, true, 'Exception must be thrown');
        }
    });
});
