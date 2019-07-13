"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const Config_1 = require("./Config");
const os_1 = require("os");
const logger_1 = require("@mazemasterjs/logger");
const router_1 = require("./router");
// get logger &  config instances
const log = logger_1.Logger.getInstance();
const config = Config_1.Config.getInstance();
// create express app and an HTTPServer reference
const app = express_1.default();
// declare cache and httpServer refs
let httpServer;
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
    app.use(compression_1.default());
    // set up the base /game router
    app.use('/', router_1.router);
    // and start the httpServer - starts the service
    httpServer = app.listen(config.HTTP_PORT, () => {
        // sever is now listening - live probe should be active, but ready probe must wait for routes to be mapped.
        log.force(__filename, 'launchExpress()', `Express is listening -> http://${os_1.hostname}:${config.HTTP_PORT}`);
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
//# sourceMappingURL=server.js.map