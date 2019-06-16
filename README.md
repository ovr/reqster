# Reqster

> Promise-d HTTP client for the browser and node.js written in TypeScript

## Features

- `@reqster/browser` for browser (using fetch)
- `@reqster/node` for node.js (using http/https modules)
- `@reqster/curl` for node.js (using external curl module)

## Example

```typescript
import { create } from '@reqster/browser';

const client = create('https://you-api.com/', {
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5 * 1000,
});


export type UserResponse = {
    userId: string
};

export const getUser = (id: string) => client.get<UserResponse>(`'/api/v1/user/${id}`);

const user = getUser('self');
```

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
