const express = require('express');
const fs = require('fs');
const https = require('https');
const request = require('request');

const servers = ['http://localhost:3000', 'http://localhost:3001' ];
let cur = 0;

const profilerMiddleware = (req, res, next) => {
  const start = Date.now();
  // The 'finish' event comes from core Node.js, it means Node is done handing
  // off the response headers and body to the underlying OS.
  res.on('finish', () => {
    console.log('Completed', req.method, req.url, Date.now() - start);
  });
  next();
};

const handler = (req, res) => {
	//console.log(`server ${serverNum}`, req.method, req.url, req.body);
	// Wait for 10 seconds before responding
  const _req = request({ url: servers[cur] + req.url }).on('error', error => {
    res.status(500).send(error.message);
  });
  req.pipe(_req).pipe(res);
  cur = (cur + 1) % servers.length;
};

const app = express().
  // Use `express-sslify` to make sure _all_ requests use HTTPS
  use(require('express-sslify').HTTPS()).
  use(profilerMiddleware).
  get('*', handler).
  post('*', handler);

app.listen(80);

// Start an HTTPS server with some self-signed keys
const sslOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.cert')
};
https.createServer(sslOptions, app).listen(443);

const server = express().use(profilerMiddleware).get('*', handler).post('*', handler);

server.listen(8080);