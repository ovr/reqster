# Reqster

> Promise-d HTTP client for the browser and node.js written in TypeScript

## Features

- `@reqster/browser` for browser
- `@reqster/node` for node.js

# Interceptors

## Modify Request(s) by interceptor

You modify each request by interceptor, for example let's sign all request by `Authorization` header:

```js
const session = {
    accessToken: 'XXXXX',
};

api.interceptors.request.use(async (endpoint, settings) => {
    if (session.accessToken) {
      settings.headers = {
          ...settings.headers,
        'Authorization': `Bearer ${session.accessToken}`
      }
    }
});
```

## Modify Responses(s) by interceptor

For example, let's re-try request when response's status = 555:

```js
import {ResponseInterceptorResultEnum} from '@reqster/core';

api.interceptors.response.use(async (endpoint, settings, response) => {
    if (response.status === 555) {
        return ResponseInterceptorResultEnum.RETRY;
    }

    return ResponseInterceptorResultEnum.NOTHING;
});
```
