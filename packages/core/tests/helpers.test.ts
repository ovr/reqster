import {assert} from 'chai';
import {transformRequest} from "../src";

describe('transformRequest', function() {
    it(`default transformation`, () => {
        const headers = {};
        const body = transformRequest({
            key: 'value'
        }, headers);

        assert.equal(body, '{"key":"value"}');
        assert.deepEqual(headers, {
            'Content-Type': 'application/json;charset=utf-8',
        });
    });
});
