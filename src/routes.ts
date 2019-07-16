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
import { IBot } from '@mazemasterjs/shared-library/Interfaces/IBot';
import { GAME_RESULTS } from '@mazemasterjs/shared-library/Enums';

// set constant utility references
const log = Logger.getInstance();
const config = Config.getInstance();

// tslint:disable-next-line: no-string-literal
axios.defaults.headers.common['Authorization'] = 'Basic ' + config.PRIMARY_SERVICE_ACCOUNT;

export const scoreboard = async (req: Request, res: Response) => {
  logRequest('scoreboard', req, true);
  const filter = req.query.filter;
  const scoreUrl = config.SERVICE_SCORE + '/get';
  const teamUrl = config.SERVICE_TEAM + '/get';
  const userUrl = config.SERVICE_TEAM + '/get/user';
  const mazeUrl = config.SERVICE_MAZE + '/get';

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Users');
  const users = await fns.doGet(userUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${users.length} user documents retrieved.`);

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Teams');
  const teams = await fns.doGet(teamUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${teams.length} team documents retrieved.`);

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Mazes');
  const mazes = await fns.doGet(mazeUrl);
  log.debug(__filename, 'scoreboard(req, res)', `${mazes.length} maze stub documents retrieved.`);

  log.debug(__filename, 'scoreboard(req, res)', 'Getting Scores');
  const scores = await fns
    .doGet(scoreUrl)
    .then(scoreData => {
      log.debug(__filename, 'scoreboard(req, res)', `${scoreData.length} score documents retrieved.`);
      return scoreData;
    })
    .catch(scoreErr => {
      log.error(__filename, 'scoreboard(req, res)', 'Error retrieving scores ->', scoreErr);
      res.status(500).send(JSON.stringify(scoreErr));
    });

  const allBots = new Array<IBot>();
  teams.forEach((team: { bots: { forEach: (arg0: (bot: IBot) => void) => void } }) => {
    team.bots.forEach((bot: IBot) => {
      allBots.push(bot);
    });
  });

  const allScores: { score: IScore; maze: IMazeStub; team: any; bot: IBot | undefined }[] = [];
  scores.forEach((score: IScore) => {
    const team = teams.find((t: { id: any }) => t.id === score.teamId);
    const maze: IMazeStub = mazes.find((m: { id: any }) => m.id === score.mazeId);
    const bot = allBots.find((b: { id: any }) => b.id === score.botId);
    if ((score.gameResult === GAME_RESULTS.WIN || score.gameResult === GAME_RESULTS.WIN_FLAWLESS) && maze.challenge > 0 && maze.name.indexOf('DEBUG') === -1) {
      allScores.push({ score, maze, team, bot });
    }
  });

  allScores.sort((ts1, ts2) => {
    return ts2.maze.name.localeCompare(ts1.maze.name) || ts2.score.totalScore - ts1.score.totalScore || ts1.score.lastUpdated - ts2.score.lastUpdated;
  });

  const topScores: { score: IScore; maze: IMazeStub; teamName: string; bot: IBot }[] = [];
  mazes.forEach((maze: IMazeStub) => {
    if (maze.challenge > 0 && maze.name.indexOf('DEBUG') === -1) {
      let tMazeIdx = allScores.findIndex(score => {
        return score.maze.id === maze.id;
      });

      // grab up to the top three scores for each maze
      if (tMazeIdx !== -1) {
        let mazeScoreCount = 0;

        while (tMazeIdx < allScores.length && allScores[tMazeIdx].maze.id === maze.id && mazeScoreCount < 3) {
          const curScore = allScores[tMazeIdx];

          if (curScore.bot !== undefined && curScore.maze.id === maze.id) {
            curScore.score.totalScore = curScore.score.totalScore * curScore.maze.challenge;

            // check for duplicate scores (bot re-runs) form same player
            const tsIdx = topScores.findIndex(ts => {
              if (curScore.bot !== undefined) {
                return ts.maze.id === curScore.maze.id && ts.score.totalScore === curScore.score.totalScore && ts.bot.id === curScore.bot.id;
              }
            });

            // don't push if it's a dupe/re-run
            if (tsIdx === -1) {
              // apply filter
              if (
                filter === 'campers' &&
                (curScore.team.name === 'The Dev Team' || curScore.team.name === 'Intern Invasion' || curScore.team.name === 'Guest Players')
              ) {
                log.debug(__filename, 'scoreboard(req, res)', `campers-only filter applied - score from ${curScore.team.name} will not be shown.`);
              } else {
                mazeScoreCount++;
                topScores.push({
                  score: curScore.score,
                  maze: curScore.maze,
                  teamName: curScore.team.name,
                  bot: curScore.bot,
                });
              }
            }
          }
          tMazeIdx++; // next score in list
        }
      }
    }
  });

  topScores.sort((s1, s2) => {
    return s2.maze.challenge - s1.maze.challenge || s2.maze.name.localeCompare(s1.maze.name);
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
