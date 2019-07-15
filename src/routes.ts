import axios from 'axios';
import { Config } from './Config';
import * as fns from './funcs';
import { MD5 as hash } from 'object-hash';
import { LOG_LEVELS, Logger } from '@mazemasterjs/logger';
import { Request, Response } from 'express';
import { Team } from '@mazemasterjs/shared-library/Team';
import { User } from '@mazemasterjs/shared-library/User';
import path from 'path';
import fs from 'fs';

// set constant utility references
const log = Logger.getInstance();
const config = Config.getInstance();

// tslint:disable-next-line: no-string-literal
axios.defaults.headers.common['Authorization'] = 'Basic ' + config.PRIMARY_SERVICE_ACCOUNT;

/**
 * Serve up the requested file
 *
 * @param {Request} req
 * @param {Response} res
 */
export const serveFile = (req: Request, res: Response) => {
  logRequest('serveFile', req);
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

export const quickHash = async (req: Request, res: Response) => {
  logRequest('editTeams', req, true);
  const textToHash = req.query.textToHash;
  if (textToHash === undefined) {
    return res.status(400).json({ status: 400, message: 'Query parameter "textToHash" was not found.' });
  } else {
    return res.json({ original: textToHash, hash: hash(textToHash) });
  }
};

export const editTeams = async (req: Request, res: Response) => {
  logRequest('editTeams', req, true);
  const teamUrl = config.SERVICE_TEAM + '/get';
  const userUrl = config.SERVICE_TEAM + '/get/user';
  const teamId = req.query.teamId;

  const users = await fns.doGet(userUrl);
  const teams = await fns.doGet(teamUrl);
  let team = teams[0];

  log.debug(__filename, 'editTeams()', `${teams.length} teams returned.`);

  if (teamId !== undefined) {
    if (teamId === 'NEW_TEAM') {
      const newTeam: Team = new Team();
      newTeam.Name = 'NEW TEAM';
      newTeam.Logo = 'http://mazemasterjs.com/media/images/team-logos/unknown.png';
      newTeam.Bots = [];
      teams.push(newTeam);
      team = newTeam;
    } else {
      const selTeam = teams.find((item: { id: any }) => {
        return teamId === item.id;
      });

      if (selTeam !== undefined) {
        team = selTeam;
      }
    }
  }

  return res.render('team-editor.ejs', { users, teams, team });
};

export const editUsers = async (req: Request, res: Response) => {
  logRequest('editusers', req, true);
  const userId = req.query.userId;
  const teamUrl = config.SERVICE_TEAM + '/get';
  const userUrl = config.SERVICE_TEAM + '/get/user';

  const users = await fns.doGet(userUrl);
  const teams = await fns.doGet(teamUrl);
  let userIdx = 0;

  if (userId !== undefined) {
    if (userId === 'NEW_USER') {
      const newUser = new User();
      newUser.UserName = 'NEW_USER';
      users.push(newUser);
      userIdx = users.length - 1;
    } else {
      userIdx = users.findIndex((user: { id: any }) => {
        return user.id === userId;
      });

      if (userIdx === -1) {
        userIdx = 0;
      }
    }
  }

  log.debug(__filename, 'editusers()', `${users.length} users returned.`);

  return res.render('user-editor.ejs', { users, teams, user: users[userIdx] });
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
