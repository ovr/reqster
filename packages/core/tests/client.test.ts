import {assert} from 'chai';
import {
    Client,
    getDefaultClientSettings,
    ReqsterRequestDirectSettings,
    ReqsterResponse,
    ReqsterResponseHeaders,
    ReqsterSettings
} from "../src";

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
        public status: number
    ) {}

    public clone(): ReqsterResponse {
        return this;
    }

    public async text() {
        return 'fake response';
    }

    public async json() {
        throw new Error('fake');
    }
}

type Executor = (url: string, settings: ReqsterSettings & ReqsterRequestDirectSettings) => Promise<ReqsterResponse>;

function createTestClient(executor: Executor) {
    return new Client(
        executor,
        'http://localhost',
        {
            ...getDefaultClientSettings(),
            transformResponse: async (response, endpoint) => response
        }
    )
}

describe('Client', function() {
    it('Simple request', async function() {
        const client = createTestClient(async () => new FakeResponse(200));

        const response = await client.request('/v1/user', {
            method: 'GET'
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
            assert.equal(url, 'http://localhost/v1/user?a=hello&b=test&c[]=1&c[]=2&c[]=3');
            assert.equal(settings.method, 'GET');

            return new FakeResponse(200);
        });

        const response = await client.get('/v1/user', {
            params: {
                a: 'hello',
                b: 'test',
                c: [1, 2, 3]
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
});
