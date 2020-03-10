'use strict';

/**
 * This is the entry-point for the service. The service houses
 * app and plugins (if any). It starts first and prepares
 * such an environment for the app and plugins where
 * all the backing services were connected and
 * configuration was read, and finally
 * listeners were registered
 * (via app's and plugins'
 * entry-points).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const Router = require('@rezeus/korauter');
const Koa = require('koa');

const AsyncEventEmitter = require('./src/AsyncEventEmitter');
const Logger = require('./src/Logger');
const entryPoints = require('./entry-points');
const defaultConfig = require('./default-config');

const gatherConfig = require('./src/config');

Object.defineProperty(global, 'ROOT_DIR', {
  value: __dirname,
  writable: false,
});

let thisServiceExitCode; // Continue if `undefined`, exit the process otherwise
/** @type {import('http').Server} */
let server;
const ee = new AsyncEventEmitter();

// Gather config
const config = Object.freeze(gatherConfig(defaultConfig));

// #region Logger

const logLevelName = `LOG_LEVEL_${config.logLevel.toUpperCase()}`;
if (!Object.prototype.hasOwnProperty.call(Logger, logLevelName)) {
  // eslint-disable-next-line no-console
  console.log(`FATAL: Invalid log level ('${config.logLevel}'). Terminating.`);
}

const logger = new Logger(Logger[logLevelName]);

// #endregion Logger

// #region Require entry-points

// Require entry-points (app and plugin(s) (if any))
//
const entryPointProviders = [];

let absDirPath = '';
let fullpath = '';
/** @type {import('fs').Stats} */
let stats;
/** @type {Array<String>} */
let currProviders;
entryPoints.forEach((entryPoint) => {
  if (entryPoint[0] === '.') {
    // Relative
    fullpath = path.join(__dirname, entryPoint);
  } else if (path.isAbsolute(entryPoint)) {
    // NOTE This is most likely not to be used
    fullpath = entryPoint;
  } else {
    // Load from node_modules

    // eslint-disable-next-line import/no-dynamic-require, global-require
    currProviders = require(entryPoint)(ee, logger);
    if (currProviders) {
      // providers.push(...currProviders);
      absDirPath = path.join(__dirname, 'node_modules', entryPoint);
      fullpath = `${absDirPath}/index.js`;
      entryPointProviders.push({
        entryPoint: fullpath,
        providers: currProviders.map((p) => path.join(absDirPath, p)),
      });
    }
    return;
  }

  // Remove trailing slash (if exists)
  //
  if (fullpath[fullpath.length - 1] === '/') {
    fullpath = fullpath.substring(0, fullpath.length - 1);
  }

  // Check if given entry-point is a file or not
  //
  stats = fs.statSync(fullpath);
  if (stats.isDirectory()) {
    absDirPath = fullpath;
    fullpath = `${fullpath}/index.js`;
  } else {
    absDirPath = path.dirname(fullpath);
  }

  if (!fs.existsSync(fullpath)) {
    throw new Error(`Entry-point to a plugin or the app ('${entryPoint}') couldn't be found at '${fullpath}'.`);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  currProviders = require(fullpath)(ee, logger);
  if (currProviders) {
    // providers.push(...currProviders);
    entryPointProviders.push({
      entryPoint: fullpath,
      providers: currProviders.map((p) => path.join(absDirPath, p)),
    });
  }
});

// #endregion Require entry-points

const stopServer = () => new Promise((resolve, reject) => {
  server.close((err) => {
    if (err) {
      // TODO Throw and proc.exit
      reject(err);
    }

    resolve();
  });
});
ee.onceAsync('/shutdown', async ([connectedBackingServices, exitCode = 0]) => {
  // TODO Handle if error thrown while awaiting below

  // Close connected backing services connections
  //
  const connectedBackingServicesKeys = Object.keys(connectedBackingServices);
  if (connectedBackingServicesKeys.length > 0) {
    await Promise.all(
      // eslint-disable-next-line comma-dangle
      connectedBackingServicesKeys.map((key) => connectedBackingServices[key].provider.stop())
    );
  }

  // Stop the server if listening
  //
  if (typeof server !== 'undefined' && server.listening) {
    await stopServer();
  }

  logger.log('Graceful shutdown done.');
  thisServiceExitCode = exitCode;
});

const start = async () => {
  // #region Process and start providers

  // Connect to each and every provider in `providers` sequentially
  //
  let providers = [];
  entryPointProviders.forEach((epp) => {
    providers = [...providers, ...epp.providers];
  });

  const backingServiceReferences = {};
  /** @type {Provider} */
  let currProvider;
  let currService;

  // eslint-disable-next-line no-restricted-syntax
  // for (const [i, currProviderPath] of providers.entries()) {
  for (
    let i = 0, currProviderPath = providers[i];
    i < providers.length;
    i += 1, currProviderPath = providers[i]
  ) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    currProvider = require(currProviderPath);

    try {
      // eslint-disable-next-line no-await-in-loop
      currService = await currProvider.start(config);

      backingServiceReferences[currService.name] = {
        provider: currProvider,
        service: currService.reference,
      };
    } catch (err) {
      logger.error(`Error occurred while connecting to a backing service ('${currProviderPath}'). Shutting down gracefully. Error: '${err.name}: ${err.message}'.`);

      // NOTE Send `backingServiceReferences` as it is because it contains already \
      //      connected backing services, which of those SHOULD be closed cleanly.
      // eslint-disable-next-line no-await-in-loop
      await ee.emitAsync('/shutdown', [backingServiceReferences, -1]); // FIXME Why MUST we use an array as the payload
      break;
    }
  }
  if (thisServiceExitCode) {
    process.exit(thisServiceExitCode);
  }

  // #endregion Process and start providers

  // NOTE Everything goes successfully in booting phase

  const router = new Router({
    pathPrefix: config.baseUrl,
  });

  // NOTE Add service related routes here so
  //      that they can not be overwritten.
  // router.get('/srv', (ctx) => {
  //   ctx.body = { status: 'OK' };
  // });

  await ee.emitAsync('/router/routes/registering', router);
  ee.emit('/router/routes/registered');

  // #region Koa, Router and middlewares

  // Instantiate Koa
  const koa = new Koa();

  // await ee.emitAsync('/server/context/creating', koa.context);

  Object.defineProperty(koa.context, 'config', {
    value: config,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(koa.context, 'ee', {
    value: ee,
    writable: false,
    configurable: false,
  });

  koa.context.services = {};
  Object.keys(backingServiceReferences).forEach((name) => {
    Object.defineProperty(koa.context.services, name, {
      value: backingServiceReferences[name].service,
      writable: false,
      configurable: false,
    });
  });

  // Let the app and plugins (if any) add necessary things to the app context
  await ee.emitAsync('/kernel/services/created', koa.context, koa.context.services);

  Object.defineProperty(koa.context, 'logger', {
    value: logger,
    writable: false,
    configurable: false,
  });


  const [...middlewares] = await ee.emitAsync('/router/middlewares/registering', config);
  // Flatten the array
  const flatMiddlewares = middlewares.reduce((p, c) => [...p, ...c], [])
    .filter((m) => typeof m === 'function');
  ee.emit('/router/middlewares/registered');


  /**
   * @param {KoaContext} ctx
   * @param {Function} next
   */
  async function responseTime(ctx, next) {
    ctx.state.startTime = Date.now();

    await next();
  }

  //

  // Register middlewares
  //
  koa.use(responseTime);

  // Service-wide default error handler (for `ctx.throw()`)
  koa.use(async (/** @type {KoaContext} */ ctx, /** @type {Function} */ next) => {
    try {
      if (!ctx.config.env || ctx.config.env !== 'test') {
        console.log(`--> ${ctx.request.method} ${ctx.request.url}`);
      }

      await next();

      if (!ctx.config.env || ctx.config.env !== 'test') {
        console.log(`<-- ${ctx.response.status} (${Date.now() - ctx.state.startTime} ms)`);
      }
    } catch (err) {
      // TODO Try here with `koa.expose = false`
      ctx.status = err instanceof Koa.HttpError
        ? err.status
        : 500;

      if (!ctx.config.env || ctx.config.env !== 'test') {
        console.log(`<-- ${ctx.status} '${err.message}'`);
      }

      ctx.body = { message: err.message };
    }
  });

  // TODO MAYBE Do this (i.e. custom CORS middleware) in somewhere else
  //            To do that (to move somewhere else) emit an event to register "before" middlewares (e.g. for error handler, logger)
  koa.use(/* customCors */ async (ctx, next) => {
    ctx.set('access-control-allow-origin', '*');
    ctx.set('access-control-allow-methods', 'OPTIONS, HEAD, GET, POST, PUT, DELETE');
    ctx.set('access-control-allow-headers', ctx.get('access-control-request-headers'));

    if (ctx.method.toUpperCase() === 'OPTIONS') {
      const headerKeys = Object.keys(ctx.headers);

      if (headerKeys.includes('HTTP_ACCESS_CONTROL_REQUEST_METHOD')) {
        ctx.set('Access-Control-Allow-Methods', 'OPTIONS, HEAD, GET, POST, PUT, DELETE');
      }

      if (headerKeys.includes('HTTP_ACCESS_CONTROL_REQUEST_HEADERS')) {
        // eslint-disable-next-line dot-notation
        ctx.set('Access-Control-Allow-Headers', ctx.headers['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
      }

      ctx.status = 200;
      return;
    }

    await next();
  });

  koa.use(router.resolve());

  flatMiddlewares.forEach((mw) => {
    koa.use(mw);
  });

  //

  koa.use(router.handle());

  //

  // #endregion Koa, Router and middlewares

  // Create server and emit necessary events
  //
  server = http.createServer(koa.callback());

  // ee.emit('/server/before-listening');
  server.once('listening', () => {
    logger.log(`Listening on http://${config.host}:${config.port}`);
    ee.emit('/server/listening');
  });
  server.listen(config.port, config.host);

  // TODO Register SIGTERM listener to initiate graceful shutdown

  // NOTE From now on the backing services are connected, server \
  //      started to listen and the app has the control
};

if (require.main === module) {
  start();
} else {
  module.exports = {
    ee,
    config,
    start,
  };
}


/** @typedef {import('koa').Context} KoaContext */
