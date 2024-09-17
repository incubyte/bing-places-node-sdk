# Bing Places Node SDK

A clean, re-usable Node (TypeScript) SDK for Bing Places API. You can think of this as a simple wrapper written on top of the [Bing Places API](https://bpprodpublicstorage.blob.core.windows.net/bingplacesapi/BingPlaces_API_v1.0.pdf) for convenience and integrability with other systems.

![Bing Places](https://github.com/incubyte/bing-places-node-sdk/blob/main/assets/bing-places-for-business-logo.png)

## Supported APIs

1. Create businesses
2. Create 1 business
3. Update businesses
4. Fetch added businesses
5. Get Analytics of businesses
6. Delete businesses
7. Create chain
8. Update bulk chain info

## Features

- Configurable retries.
- Additional endpoints for specific business use-cases (like 'closeBusinesses'). [needs scoping]
- Monitoring (metrics: like rate limits) [needs scoping]
- Easy integration with existing Node.js applications.
- Verbose mode for detailed logging for debugging and auditing. (TODO)
- Batch processing for bulk operations. (TODO)

## References

- [Bing Places For Business API Documentation (PDF).](https://bpprodpublicstorage.blob.core.windows.net/bingplacesapi/BingPlaces_API_v1.0.pdf)
