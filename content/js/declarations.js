const declarations = [];
declarations.push('');
declarations.push('/**');
declarations.push(' * Sends a command to the MazeMasterJS Game Server');
declarations.push(' *');
declarations.push(' * @param {action} action Actions include: command, direction, and (optional) message.');
declarations.push(' * @param {callback} callback The function return a server response to, usually solveMaze. ');
declarations.push(' *         If no callback is provided, your bot will not receive result data from the action you sent.');
declarations.push(' */');
declarations.push('declare function SendAction(action: any, callback?: any): void');

declarations.push('declare const LOG_TYPES = {');
declarations.push('  BOT: "bot",');
declarations.push('  WARN: "wrn",');
declarations.push('  ERROR: "err",');
declarations.push('};');

declarations.push('declare const DIRECTIONS = {');
declarations.push('  NONE: 0,');
declarations.push('  NORTH: 1,');
declarations.push('  SOUTH: 2,');
declarations.push('  EAST: 4,');
declarations.push('  WEST: 8,');
declarations.push('  LEFT: 16,');
declarations.push('  RIGHT: 32');
declarations.push('};');

declarations.push('declare const PLAYER_STATES = {');
declarations.push('  NONE: 0,');
declarations.push('  STANDING: 1,');
declarations.push('  SITTING: 2,');
declarations.push('  LYING: 4,');
declarations.push('  STUNNED: 8,');
declarations.push('  BLIND: 16,');
declarations.push('  BURNING: 32,');
declarations.push('  LAMED: 64,');
declarations.push('  BEARTRAPPED: 128,');
declarations.push('  SLOWED: 256,');
declarations.push('  DEAD: 512');
declarations.push('};');

declarations.push('declare const COMMANDS = {');
declarations.push('  NONE: 0,');
declarations.push('  FACE: 1,');
declarations.push('  SIT: 4,');
declarations.push('  STAND: 6,');
declarations.push('  TURN: 7,');
declarations.push('  MOVE: 8,');
declarations.push('  JUMP: 9,');
declarations.push('  WAIT: 10,');
declarations.push('  WRITE: 11,');
declarations.push('  SNEAK: 13');
declarations.push('};');

// add a couple of aliases for common enums
declarations.push('declare const DIRS = DIRECTIONS;');
declarations.push('declare const CMDS = COMMANDS;');

// and some stuff related to BOT_RAM
declarations.push('declare const BOT_RAM: any;');
declarations.push('/**');
declarations.push(' * Returns the number of object keys in BOT_RAM');
declarations.push(' * ');
declarations.push(' * @return {number} The number of object keys found in BOT_RAM');
declarations.push(' */');
declarations.push('declare function getBotRamLength(): number');

declarations.push('/**');
declarations.push(' *');
declarations.push(' * @param {LOG_TYPES} LOG_TYPE - The type of message to log: LOG_TYPE.BOT, LOG_TYPE.WARN, or LOG_TYPE.ERROR');
declarations.push(' * @param {string} msgHeader - The text of the header to be displayed in the log entry.');
declarations.push(' * @param {string?} msgBody - Optional - The text of the body to be displayed in the log entry.');
declarations.push(' */');
declarations.push('declare function logMessage(LOG_TYPE:LOG_TYPES, msgHeader:string, msgBody?: string): void;');

declarations.push('declare interface IPlayerData {');
declarations.push('  facing: number;');
declarations.push('  state: number;');
declarations.push('  isSitting: boolean;');
declarations.push('  isLyingDown: boolean;');
declarations.push('  isStunned: boolean;');
declarations.push('  isSlowed: boolean;');
declarations.push('  isPoisoned: boolean;');
declarations.push('  health: number;');
declarations.push('}');

declarations.push('declare interface IRoomData {');
declarations.push('  exitNorth: boolean;');
declarations.push('  exitSouth: boolean;');
declarations.push('  exitEast: boolean;');
declarations.push('  exitWest: boolean;');
declarations.push('  messages: Array<string>;');
declarations.push('}');

declarations.push('declare interface ISightData {');
declarations.push('  sight: string;');
declarations.push('  distance: number;');
declarations.push('}');

declarations.push('declare interface ISoundData {');
declarations.push('  sound: string;');
declarations.push('  volume: number;');
declarations.push('}');

declarations.push('declare interface IScentData {');
declarations.push('  scent: string;');
declarations.push('  strength: number;');
declarations.push('}');

declarations.push('declare interface ITouchData {');
declarations.push('  feeling: string;');
declarations.push('  intensity: number;');
declarations.push('}');

declarations.push('declare interface IFlavorData {');
declarations.push('  taste: string;');
declarations.push('  strength: number;');
declarations.push('}');

declarations.push('declare interface ISeeData {');
declarations.push('  north: Array<ISightData>;');
declarations.push('  south: Array<ISightData>;');
declarations.push('  east: Array<ISightData>;');
declarations.push('  west: Array<ISightData>;');
declarations.push('}');

declarations.push('declare interface IHearData {');
declarations.push('  north: Array<ISoundData>;');
declarations.push('  south: Array<ISoundData>;');
declarations.push('  east: Array<ISoundData>;');
declarations.push('  west: Array<ISoundData>;');
declarations.push('}');

declarations.push('declare interface ISmellData {');
declarations.push('  north: Array<IScentData>;');
declarations.push('  south: Array<IScentData>;');
declarations.push('  east: Array<IScentData>;');
declarations.push('  west: Array<IScentData>;');
declarations.push('}');

declarations.push('declare interface IFeelData {');
declarations.push('  north: Array<ITouchData>;');
declarations.push('  south: Array<ITouchData>;');
declarations.push('  east: Array<ITouchData>;');
declarations.push('  west: Array<ITouchData>;');
declarations.push('}');

declarations.push('declare interface ITasteData {');
declarations.push('  north: Array<IFlavorData>;');
declarations.push('  south: Array<IFlavorData>;');
declarations.push('  east: Array<IFlavorData>;');
declarations.push('  west: Array<IFlavorData>;');
declarations.push('}');

declarations.push('declare interface ResponseData {');
declarations.push('  player: IPlayerData;');
declarations.push('  outcomes: Array<string>;');
declarations.push('  room: IRoomData;');
declarations.push('  see: ISeeData;');
declarations.push('  hear: IHearData;');
declarations.push('  smell: ISmellData;');
declarations.push('  touch: IFeelData;');
declarations.push('  taste: ITasteData;');
declarations.push('}');

declarations.push('declare const GameData: ResponseData;');

// eslint-disable-next-line no-unused-vars
const MMJS_EDITOR_LIB = declarations.join('\n');
