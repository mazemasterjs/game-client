"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Config_1 = require("./Config");
const fns = __importStar(require("./funcs"));
const object_hash_1 = require("object-hash");
const logger_1 = require("@mazemasterjs/logger");
const Team_1 = require("@mazemasterjs/shared-library/Team");
const User_1 = require("@mazemasterjs/shared-library/User");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// set constant utility references
const log = logger_1.Logger.getInstance();
const config = Config_1.Config.getInstance();
// tslint:disable-next-line: no-string-literal
axios_1.default.defaults.headers.common['Authorization'] = 'Basic ' + config.PRIMARY_SERVICE_ACCOUNT;
exports.scoreboard = (req, res) => __awaiter(this, void 0, void 0, function* () {
    logRequest('scoreboard', req, true);
    return res.status(200).send('Temporarily Disbled');
    const filter = req.query.filter;
    const teamGames = req.query.teamGames;
    const scoreUrl = config.SERVICE_SCORE + '/get';
    const teamUrl = config.SERVICE_TEAM + '/get';
    const userUrl = config.SERVICE_TEAM + '/get/user';
    const mazeUrl = config.SERVICE_MAZE + '/get';
    log.debug(__filename, 'scoreboard(req, res)', 'Getting Users');
    const users = yield fns.doGet(userUrl);
    log.debug(__filename, 'scoreboard(req, res)', `${users.length} user documents retrieved.`);
    log.debug(__filename, 'scoreboard(req, res)', 'Getting Teams');
    let teams = yield fns.doGet(teamUrl);
    log.debug(__filename, 'scoreboard(req, res)', `${teams.length} team documents retrieved.`);
    log.debug(__filename, 'scoreboard(req, res)', 'Getting Mazes');
    const mazes = yield fns.doGet(mazeUrl);
    log.debug(__filename, 'scoreboard(req, res)', `${mazes.length} maze stub documents retrieved.`);
    let teamQuery = '';
    if (filter === 'campers') {
        const camperTeams = new Array();
        teams.forEach(t => {
            if (t.name !== 'The Dev Team' && t.name !== 'Intern Invasion' && t.name !== 'Guest Players') {
                camperTeams.push(t);
                teamQuery = teamQuery + '&teamIds[]=' + t.id;
            }
        });
        teams = camperTeams;
    }
    const topScores = [];
    for (const maze of mazes) {
        if (maze.challenge > 0 && maze.name.indexOf('DEBUG') === -1) {
            yield fns.doGet(scoreUrl + '/topScores?mazeId=' + maze.id + teamQuery + (teamGames ? '&teamGames=true' : '')).then(scores => {
                scores.forEach((score) => {
                    const team = teams.find(t => {
                        return t.id === score.teamId;
                    });
                    const bot = team.bots.find((b) => {
                        return b.id === score.botId;
                    });
                    topScores.push({ mazeName: maze.name, mazeLevel: maze.challenge, score, teamName: team.name, bot });
                });
            });
        }
    }
    topScores.sort((ts1, ts2) => {
        return (ts2.mazeLevel - ts1.mazeLevel ||
            ts2.mazeName.localeCompare(ts1.mazeName) ||
            ts2.score.totalScore - ts1.score.totalScore ||
            ts2.score.lastUpdated - ts1.score.lastUpdated);
    });
    // render the scoreboard
    res.render('scoreboard.ejs', { topScores });
});
/**
 * Serve up the requested file
 *
 * @param {Request} req
 * @param {Response} res
 */
exports.serveFile = (req, res) => {
    logRequest('serveFile', req);
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
exports.quickHash = (req, res) => __awaiter(this, void 0, void 0, function* () {
    logRequest('quickHash', req, true);
    const textToHash = req.query.textToHash;
    if (textToHash === undefined) {
        return res.status(400).json({ status: 400, message: 'Query parameter "textToHash" was not found.' });
    }
    else {
        return res.json({ original: textToHash, hash: object_hash_1.MD5(textToHash) });
    }
});
exports.editTeams = (req, res) => __awaiter(this, void 0, void 0, function* () {
    logRequest('editTeams', req, true);
    const teamUrl = config.SERVICE_TEAM + '/get';
    const userUrl = config.SERVICE_TEAM + '/get/user';
    const teamId = req.query.teamId;
    const users = yield fns.doGet(userUrl);
    const teams = yield fns.doGet(teamUrl);
    let team = teams[0];
    log.debug(__filename, 'editTeams()', `${teams.length} teams returned.`);
    if (teamId !== undefined) {
        if (teamId === 'NEW_TEAM') {
            const newTeam = new Team_1.Team();
            newTeam.Name = 'NEW TEAM';
            newTeam.Logo = 'http://mazemasterjs.com/media/images/team-logos/unknown.png';
            newTeam.Bots = [];
            teams.push(newTeam);
            team = newTeam;
        }
        else {
            const selTeam = teams.find((item) => {
                return teamId === item.id;
            });
            if (selTeam !== undefined) {
                team = selTeam;
            }
        }
    }
    return res.render('team-editor.ejs', { users, teams, team });
});
exports.editUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
    logRequest('editusers', req, true);
    const userId = req.query.userId;
    const teamUrl = config.SERVICE_TEAM + '/get';
    const userUrl = config.SERVICE_TEAM + '/get/user';
    const users = yield fns.doGet(userUrl);
    const teams = yield fns.doGet(teamUrl);
    let userIdx = 0;
    if (userId !== undefined) {
        if (userId === 'NEW_USER') {
            const newUser = new User_1.User();
            newUser.UserName = 'NEW_USER';
            users.push(newUser);
            userIdx = users.length - 1;
        }
        else {
            userIdx = users.findIndex((user) => {
                return user.id === userId;
            });
            if (userIdx === -1) {
                userIdx = 0;
            }
        }
    }
    log.debug(__filename, 'editusers()', `${users.length} users returned.`);
    return res.render('user-editor.ejs', { users, teams, user: users[userIdx] });
});
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