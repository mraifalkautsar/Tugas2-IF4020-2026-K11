# Embedded API documentation

`Register` serves Swagger UI at `/docs/` and the OpenAPI 3.0.3 specification
at `/openapi.json` (also `/docs/openapi.json`). All static files are embedded
in the Go executable; serving them does not require Node.js or network access.
Usage and publishing instructions are in [docs/api.md](../../docs/api.md).

`static/openapi.json`, `index.html`, and `swagger-initializer.js` are maintained
in this repository. Update the specification when controller behavior changes.

The JavaScript/CSS distribution is **swagger-ui-dist 5.33.2**, obtained from
the [official npm distribution](https://www.npmjs.com/package/swagger-ui-dist).
Upstream [installation documentation](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
describes this standalone bundle. Its Apache-2.0 license, NOTICE, bundled
dependency notices, source URL, and SHA-256 checksums are retained in `static/`.
`vendor.json` identifies the exact downloaded archive and vendored files.

To update Swagger UI, download a pinned `swagger-ui-dist` npm archive and
replace `swagger-ui-bundle.js`, `swagger-ui.css`, `LICENSE`, `NOTICE`, and
`swagger-ui-bundle.js.LICENSE.txt`. Refresh `vendor.json` and verify the UI
and server tests. No runtime CDN or external validator is configured.
