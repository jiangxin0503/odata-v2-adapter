"use strict";

const express = require("express");
const http = require("http");
const cds = require("@sap/cds");
const odatav2proxy = require("../../lib");

process.env.XS_APP_LOG_LEVEL = "debug";

const hanaCredentials = require("./db/default-services").hana[0].credentials;

const db = cds.connect({
  kind: "hana",
  credentials: hanaCredentials
});

module.exports = async (service, defaultPort, fnInit) => {
  let port = defaultPort || 0;
  const servicePath = `./integration-test/_env/srv/${service}`;
  const app = express();

  const srv = await cds.load(servicePath);
  await cds.serve(servicePath).in(app);

  // Backend
  let server;
  await new Promise(resolve => {
    server = new http.Server(app);
    server.listen(port, () => {
      port = server.address().port;
      console.info(`Server listening on port ${port}`);
      resolve();
    });
  });

  // Proxy
  app.use(
    odatav2proxy({
      path: "v2",
      model: servicePath,
      port: port
    })
  );

  const context = { port, server, app, cds, srv, db, tx: db.transaction() };
  if (fnInit) {
    await fnInit(context);
  }
  return context;
};

module.exports.end = context => {
  context.cds.disconnect();
  context.server.close();
};
