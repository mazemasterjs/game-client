import compression from 'compression';
import express from 'express';
import { Config } from './Config';
import { hostname } from 'os';
import { Logger } from '@mazemasterjs/logger';
import { router } from './router';
import { Server } from 'http';

// get logger &  config instances
const log = Logger.getInstance();
const config = Config.getInstance();

// create express app and an HTTPServer reference
const app = express();

// declare cache and httpServer refs
let httpServer: Server;

// let's ROCK this joint!
startServer();

function startServer() {
  launchExpress();
}

/**
 * APPLICATION ENTRY POINT
 */
function launchExpress() {
  log.debug(__filename, 'launchExpress()', 'Configuring express HTTPServer...');

  // enable http compression middleware
  app.use(compression());

  // set up the base /game router
  app.use('/', router);

  // and start the httpServer - starts the service
  httpServer = app.listen(config.HTTP_PORT_GAME, () => {
    // sever is now listening - live probe should be active, but ready probe must wait for routes to be mapped.
    log.force(__filename, 'launchExpress()', `Express is listening -> http://${hostname}:${config.HTTP_PORT_GAME}`);
    log.force(__filename, 'launchExpress()', `[ GAME-CLIENT ] is now LIVE and READY!'`);
  });
}

/**
 * Gracefully shut down the service
 */
function doShutdown() {
  log.force(__filename, 'doShutDown()', 'Service shutdown commenced.');
  if (httpServer) {
    log.force(__filename, 'doShutDown()', 'Shutting down HTTPServer...');
    httpServer.close();
  }

  log.force(__filename, 'doShutDown()', 'Exiting process...');
  process.exit(0);
}

/**
 * Watch for SIGINT (process interrupt signal) and trigger shutdown
 */
process.on('SIGINT', function onSigInt() {
  // all done, close the db connection
  log.force(__filename, 'onSigInt()', 'Got SIGINT - Exiting application...');
  doShutdown();
});

/**
 * Watch for SIGTERM (process terminate signal) and trigger shutdown
 */
process.on('SIGTERM', function onSigTerm() {
  // all done, close the db connection
  log.force(__filename, 'onSigTerm()', 'Got SIGTERM - Exiting application...');
  doShutdown();
});
