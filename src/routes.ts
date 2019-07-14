import { LOG_LEVELS, Logger } from '@mazemasterjs/logger';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// set constant utility references
const log = Logger.getInstance();

/**
 * Serve up the requested file
 *
 * @param {Request} req
 * @param {Response} res
 */
export const serveFile = (req: Request, res: Response) => {
  logRequest('serverFile', req);
  let absFile = '';
  if (req.url === '/') {
    absFile = path.resolve('content/index.html');
  } else {
    absFile = path.resolve('content/' + req.url);
  }
  log.debug(__filename, 'serveFile()', 'File requested: ' + absFile);
  if (fs.existsSync(absFile)) {
    return res.status(200).sendFile(absFile);
  } else {
    return res.status(404).send('Page Not Found');
  }
};

export const editTeams = (req: Request, res: Response) => {
  logRequest('editTeams', req, true);
  return res.status(200).json({ status: 'ok', message: 'editTeams' });
};

/**
 * Liveness and Readiness probe for K8s/OpenShift.
 * A response indicates service alive/ready.
 */
export const livenessProbe = (req: Request, res: Response) => {
  logRequest('livenessProbe', req, true);
  res.status(200).json({ probeType: 'liveness', status: 'alive' });
};
export const readinessProbe = (req: Request, res: Response) => {
  logRequest('readinessProbe', req, true);
  res.status(200).json({ probeType: 'readiness', status: 'ready' });
};

// Quick little log wrapper short-circuit called into logger when debug/trace is not enabled
function logRequest(fnName: string, req: Request, trace: boolean = false) {
  // bail out if we aren't at least at debug level
  if (log.LogLevel < LOG_LEVELS.DEBUG) {
    return;
  }

  // otherwise check log as trace or debug
  if (trace && log.LogLevel >= LOG_LEVELS.TRACE) {
    log.trace(__filename, fnName + ' -> ' + req.method, 'Handling request -> ' + req.url);
  } else {
    log.debug(__filename, fnName + ' -> ' + req.method, 'Handling request -> ' + req.url);
  }
}
