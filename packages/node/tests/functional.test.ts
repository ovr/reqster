import {assert} from 'chai';
import {create} from "../src";

const client = create(
    'https://api.github.com',
    {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en',
            'User-Agent': 'node.js'
        },
        timeout: 5 * 1000,
    }
);

describe('Client Functional', function() {
    it('GET https://api.github.com/users/ovr', async function() {
        const response = await client.request('/users/ovr', {
            method: 'GET'
        });

        assert.equal(response.login, 'ovr');
    });
});
