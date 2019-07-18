import axios from 'axios';
import { Config } from './Config';
import * as fns from './funcs';
import { MD5 as hash } from 'object-hash';
import { LOG_LEVELS, Logger } from '@mazemasterjs/logger';
import { Request, Response } from 'express';
import { Team } from '@mazemasterjs/shared-library/Team';
import { User } from '@mazemasterjs/shared-library/User';
import { IScore } from '@mazemasterjs/shared-library/Interfaces/IScore';
import { IMazeStub } from '@mazemasterjs/shared-library/Interfaces/IMazeStub';
import path from 'path';
import fs from 'fs';
import { IUser } from '@mazemasterjs/shared-library/Interfaces/IUser';

// set constant utility references
const log = Logger.getInstance();
const config = Config.getInstance();

// tslint:disable-next-line: no-string-literal
axios.defaults.headers.common['Authorization'] = 'Basic ' + config.PRIMARY_SERVICE_ACCOUNT;

export const scoreboard = async (req: Request, res: Response) => {
  logRequest('scoreboard', req, true);
  const filter = req.query.filter;
  const teamGames = req.query.teamGames;

  const scoreUrl = config.SERVICE_SCORE + '/get';
  const teamUrl = config.SERVICE_TEAM + '/get';
  const userUrl = config.SERVICE_TEAM + '/get/user';
  const mazeUrl = config.SERVICE_MAZE + '/get';

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Users');
  const users: Array<IUser> = await fns.doGet(userUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${users.length} user documents retrieved.`);

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Teams');
  let teams: Array<any> = await fns.doGet(teamUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${teams.length} team documents retrieved.`);

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Mazes');
  const mazes: Array<IMazeStub> = await fns.doGet(mazeUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${mazes.length} maze stub documents retrieved.`);

  let teamQuery = '';
  if (filter === 'campers') {
    const camperTeams: Array<any> = new Array<any>();
    teams.forEach(t => {
      if (t.name !== 'The Dev Team' && t.name !== 'Intern Invasion' && t.name !== 'Guest Players') {
        camperTeams.push(t);
        teamQuery = teamQuery + '&teamIds[]=' + t.id;
      }
    });
    teams = camperTeams;
  }

  const topScores: any = [];
  for (const maze of mazes) {
    if (maze.challenge > 0 && maze.name.indexOf('DEBUG') === -1) {
      await fns.doGet(scoreUrl + '/topScores?mazeId=' + maze.id + teamQuery + (teamGames ? '&teamGames=true' : '')).then(scores => {
        scores.forEach((score: IScore) => {
          const team = teams.find(t => {
            return t.id === score.teamId;
          });

          const bot = team.bots.find((b: any) => {
            return b.id === score.botId;
          });

          topScores.push({ mazeName: maze.name, mazeLevel: maze.challenge, score, teamName: team.name, bot });
        });
      });
    }
  }

  topScores.sort((ts1: any, ts2: any) => {
    return (
      ts2.mazeLevel - ts1.mazeLevel ||
      ts2.mazeName.localeCompare(ts1.mazeName) ||
      ts2.score.totalScore - ts1.score.totalScore ||
      ts2.score.lastUpdated - ts1.score.lastUpdated
    );
  });

  // render the scoreboard
  res.render('scoreboard.ejs', { topScores });
};

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
  logRequest('quickHash', req, true);
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
