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