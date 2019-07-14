"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@mazemasterjs/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// set constant utility references
const log = logger_1.Logger.getInstance();
/**
 * Serve up the requested file
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.serveFile = (req, res) => {
    logRequest('serverFile', req);
    let absFile = '';
    if (req.url === '/') {
        absFile = path_1.default.resolve('content/index.html');
    }
    else {
        absFile = path_1.default.resolve('content/' + req.url);
    }
    log.debug(__filename, 'serveFile()', 'File requested: ' + absFile);
    if (fs_1.default.existsSync(absFile)) {
        return res.status(200).sendFile(absFile);
    }
    else {
        return res.status(404).send('Page Not Found');
    }
};
exports.editTeams = (req, res) => {
    logRequest('editTeams', req, true);
    return res.status(200).json({ status: 'ok', message: 'editTeams' });
};
/**
 * Liveness and Readiness probe for K8s/OpenShift.
 * A response indicates service alive/ready.
 */
exports.livenessProbe = (req, res) => {
    logRequest('livenessProbe', req, true);
    res.status(200).json({ probeType: 'liveness', status: 'alive' });
};
exports.readinessProbe = (req, res) => {
    logRequest('readinessProbe', req, true);
    res.status(200).json({ probeType: 'readiness', status: 'ready' });
};
// Quick little log wrapper short-circuit called into logger when debug/trace is not enabled
function logRequest(fnName, req, trace = false) {
    // bail out if we aren't at least at debug level
    if (log.LogLevel < logger_1.LOG_LEVELS.DEBUG) {
        return;
    }
    // otherwise check log as trace or debug
    if (trace && log.LogLevel >= logger_1.LOG_LEVELS.TRACE) {
        log.trace(__filename, fnName + ' -> ' + req.method, 'Handling request -> ' + req.url);
    }
    else {
        log.debug(__filename, fnName + ' -> ' + req.method, 'Handling request -> ' + req.url);
    }
}
//# sourceMappingURL=routes.js.map