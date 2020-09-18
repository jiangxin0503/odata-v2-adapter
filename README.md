# @sap/cds-odata-v2-adapter-proxy (cov2ap)

[CDS OData V2 Adapter Proxy](https://www.npmjs.com/package/@sap/cds-odata-v2-adapter-proxy) for [CDS OData V4 Services](https://cap.cloud.sap/docs/)

Based on the [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/docs/)
using CDS Node.js module [@sap/cds](https://www.npmjs.com/package/@sap/cds) or CDS Java modules
[com.sap.cds](https://mvnrepository.com/artifact/com.sap.cds).

## Getting Started

> Only available SAP internally!

- Clone repository
- Unit Tests: `npm test`
- Test Server: `npm start`
  - Service: `http://localhost:4004/v2/main`
  - Metadata: `http://localhost:4004/v2/main/$metadata`
  - Data: `http://localhost:4004/v2/main/Header?$expand=Items`

## Usage

### CDS Combined Backend (CAP Node.js) - Integrated

In your existing `@sap/cds` project:

- Run `npm install @sap/cds-odata-v2-adapter-proxy -s`
- Create new file `server.js` in the service folder `srv` of your project: `./srv/server.js`

```
const cds = require("@sap/cds");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
cds.on("bootstrap", app => app.use(proxy()));
module.exports = cds.server;
```

- Run `cds run` from the project root to start the server:
  - OData V2 service will be available at http://localhost:4004/v2/<service-path>
  - OData V4 service will be available at http://localhost:4004/<service-path>

Note that `@sap/cds` and `express` are peer dependency and needs to be available as module as well.

### CDS Combined Backend (CAP Node.js) - Custom

In your existing `@sap/cds` project:

- Run `npm install @sap/cds-odata-v2-adapter-proxy -s`
- Create new file `index.js` in the service folder `srv` of your project: `./srv/index.js`

```
const express = require("express");
const cds = require("@sap/cds");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");

const host = "0.0.0.0";
const port = process.env.PORT || 4004;

(async () => {
  const app = express();

  // OData V4
  await cds.connect("db").serve("all").in(app);

  // OData V2
  app.use(proxy());

  const server = app.listen(port, host, () => console.info(`app is listing at ${host}:${port}`));
  server.on("error", error => console.error(error.stack));
})();
```

- Run `node srv/index` from the project root to start the server:
  - OData V2 service will be available at http://localhost:4004/v2/<service-path>
  - OData V4 service will be available at http://localhost:4004/<service-path>

Note that `@sap/cds` and `express` are peer dependency and needs to be available as module as well.

### CDS Standalone Backend (CAP Java or CAP Node.js)

In a new Node.js express project:

- Run `npm install @sap/cds -s`
- Run `npm install @sap/cds-odata-v2-adapter-proxy -s`
- Place CDS models in `db` and `srv` model folders or provide a generated CSN
- Create a new file `index.js` in the service folder `srv` of the project: `./srv/index.js`

```
const express = require("express");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");

const host = "0.0.0.0";
const port = process.env.PORT || 4004;

(async () => {
  const app = express();

  // OData V2
  app.use(proxy({
    target: "<odata-v4-backend-url>", // locally e.g. http://localhost:8080
    services: {
      "<odata-v4-service-path>": "<qualified.ServiceName>"
    }
  }));

  const server = app.listen(port, host, () => console.info(`app is listing at ${host}:${port}`));
  server.on("error", error => console.error(error.stack));
})();
```

- A deployed version of CDS OData V2 Adapter Proxy shall have option `target` set to the deployed OData V4 backend URL.
  This can be retrieved from the Cloud Foundry environment using `process.env`, for example,
  from the `destinations` environment variable. Locally e.g. http://localhost:8080 can be used.
- In proxy option `services`, every OData V4 service URL path needs to mapped to
  the corresponding fully qualified CDS service name, e.g. `"/odata/v4/MainService/": "test.MainService"`,
  to establish the back-link connection between OData URL and its CDS service.
- Make sure, that your CDS models are also available in the project.
  Those reside either in `db` and `srv` folders, or a compiled (untransformed) `srv.json` is provided.
  This can be generated by using the following command:

  ```
  cds srv -s all -o .
  ```

- Alternatively, a `cds build` can be triggered as described in section "Cloud Foundry Deployment".
- If not detected automatically, the model path can be set with option `model` (especially if `csn.json`/`srv.json` option is used).
- Make sure, that all i18n property files reside next to the `csn.json` in a `i18n` or `_i18n` folder, to be detected by localization.
- In a multitenant scenario in combination with a standalone proxy, the CDS model can be retrieved remotely via MTX endpoint (`mtxEndpoint`) by setting proxy option `mtxRemote: true`.
- Proxy option `mtxEndpoint` can be specified as absolute url (starting with `http://` or `https://`), to be able to address MTX Sidecar
  possibly available under a target different from OData v4 backend URL. If not specified absolutely, proxy `target` is prepended to `mtxEndpoint`.

- Run `node srv/index` from the project root to start the server:
  - OData V2 service will be available at http://localhost:4004/v2/<odata-v4-service-path>
  - OData V4 service shall be available at http://localhost:8080/<odata-v4-service-path>

Note that `@sap/cds` and `express` are peer dependency and needs to be available as module as well.

## Cloud Foundry Deployment

When deploying the CDS OData V2 Adapter Proxy to Cloud Foundry, make sure that it has access to the whole CDS model.
Especially, it’s the case, that normally the Node.js server is only based on folder `srv` and folder `db` is then missing on Cloud Foundry.

To come around this situation, trigger a `cds build` during development time, that generates a `csn.json` at location `gen/srv/srv/csn.json`.
Point your Cloud Foundry deployment of the CDS OData V2 Adapter Proxy to the folder `gen/srv` (using manifest.json or MTA), so that
the CDS models can be found via file `srv/csn.json`, during runtime execution on Cloud Foundry.

Make sure, that all i18n property files reside next to the `csn.json` in a `i18n` or `_i18n` folder, to be detected by localization.

## SAP Fiori Elements V2

The OData V2 service provided by the CDS OData V2 Adapter Proxy can be used to serve an SAP Fiori Elements V2 UI.

A running example can be tested as follows:

> Only available SAP internally!

- Clone repository
- Start server: `npm run cds:run`
- Open Fiori Launchpad:
  http://localhost:4004/webapp/test/flpSandbox.html

## Documentation

Instantiates a CDS OData V2 Adapter Proxy Express Router for a CDS-based OData V4 Server:

- **options:** CDS OData V2 Adapter Proxy options object
  - **options.base:** Base path under which the service is reachable. Default is `''`.
  - **options.path:** Path under which the proxy is reachable. Default is `'v2'`.
  - **options.model:** CDS service model (path(s) or CSN). Default is `'all'`.
  - **options.port:** Target port, which points to OData V4 backend port. Default is process.env.PORT or `4004`.
  - **options.target:** Target, which points to OData V4 backend host/port. Default is e.g. `'http://localhost:4004'`.
  - **options.targetPath:** Target path to which is redirected. Default is `''`.
  - **options.services:** Service mapping object from url path name to service name. Default is `{}`.
  - **options.mtxRemote:** CDS model is retrieved remotely via MTX endpoint for multitenant scenario. Default is `false`.
  - **options.mtxEndpoint:** Endpoint to retrieve MTX metadata when option 'mtxRemote' is active. Default is `'/mtx/v1'`.
  - **options.ieee754Compatible:** `Edm.Decimal` and `Edm.Int64` are serialized IEEE754 compatible. Default is `true`.
  - **options.disableNetworkLog:** Disable networking logging. Default is `true`.

All CDS OData V2 Adapter Proxy options can also be specified as part of CDS project-specific configuration
under section `cds.cov2ap` and accessed via `cds.env`.

Option `cds.env.odata.v2proxy.urlpath` is available to specify an OData V2 proxy url path 
different from default `/v2` for CDS core. 

### CDS Annotations

The following CDS OData V2 Adapter Proxy specific annotations are supported:

- `@cov2ap.analytics`: Suppress analytics conversion for the annotated entity, if set to `false`.

### CDS Modelling

CDS supports modelling features that are not compatible with OData V2 standard:

- **Structured Types:** Usage of `cds.odata.format: 'structured'` is not supported in combination with OData V2
- **Arrayed Types:** Usages of `array of` or `many` in entity element definitions lead to CDS compilation error: `Element must not be an "array of" for OData V2`

To provide an OData V2 service based on the CDS OData V2 Adapter Proxy, those CDS modelling features must not be used.

## Logging

Logging is controlled with environment variable `XS_APP_LOG_LEVEL`. Especially, proxy requests and proxy responses
including url and body adaptations can be traced using `XS_APP_LOG_LEVEL=debug`.
Details can be found at [@sap/logging](https://www.npmjs.com/package/@sap/logging).

## Features

- GET, POST, PUT/PATCH, DELETE
- Batch support
- Actions, Functions
- Analytical Annotations
- Deep Expands/Selects
- JSON format
- Deep Structures
- Data Type Mapping
- IEEE754Compatible
- Messages/Error Handling
- Location Header
- $inlinecount / $count / \$value
- Entity with Parameters
- Stream Support (Octet and Url)
- Content Disposition
- Multitenancy, Extensibility
- Content-ID
- Draft Support
- Search Support
- Localization
- Temporal Data
- Tracing Support
- Logging Correlation
- ETag Support (Concurrency Control)
- Delta Responses

## OData V2/V4 Delta

[What’s New in OData Version 4.0](http://docs.oasis-open.org/odata/new-in-odata/v4.0/cn01/new-in-odata-v4.0-cn01.html)

## License

This package is provided under the terms of the [SAP Developer License Agreement](https://tools.hana.ondemand.com/developer-license-3.1.txt).
