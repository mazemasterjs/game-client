import Logger from '@mazemasterjs/logger';

const log = Logger.getInstance();

export class Config {
  /**
   * Instantiate and/or returns class instance
   */
  public static getInstance(): Config {
    if (this.instance === undefined) {
      this.instance = new Config();
    }

    return this.instance;
  }

  // singleton instance reference
  private static instance: Config;

  public readonly HTTP_PORT: number;
  public readonly LOG_LEVEL: number;
  public readonly PRIMARY_SERVICE_ACCOUNT: string;

  public readonly SERVICE_MAZE: string;
  public readonly SERVICE_SCORE: string;
  public readonly SERVICE_TEAM: string;
  public readonly SERVICE_TROPHY: string;
  public readonly SERVICE_GAME: string;

  // singleton pattern - constructor is private, use static Config.getInstance()
  private constructor() {
    this.LOG_LEVEL = this.getVar('LOG_LEVEL', 'number');
    log.LogLevel = this.LOG_LEVEL;

    this.HTTP_PORT = this.getVar('HTTP_PORT', 'number');
    this.SERVICE_MAZE = this.getVar('SERVICE_MAZE', 'string');
    this.SERVICE_SCORE = this.getVar('SERVICE_SCORE', 'string');
    this.SERVICE_TEAM = this.getVar('SERVICE_TEAM', 'string');
    this.SERVICE_TROPHY = this.getVar('SERVICE_TROPHY', 'string');
    this.SERVICE_GAME = this.getVar('SERVICE_GAME', 'string');
    this.PRIMARY_SERVICE_ACCOUNT = this.getVar('PRIMARY_SERVICE_ACCOUNT', 'string');
  }

  /**
   * Gets and returns the value of the requested environment variable
   * as the given type.
   *
   * @param varName - the name of the environment variable to get
   * @param typeName - tye name of the type to return the value as (string | number)
   */
  private getVar = (varName: string, typeName: string): any => {
    const val = process.env[varName];

    // first see if the variable was found - if not, let's blow this sucker up
    if (val === undefined) {
      this.doError(`getVar(${varName}, ${typeName})`, 'Configuration Error', `Environment variable not set: ${varName}`);
    }

    // we have a value - log the good news
    log.info(__filename, `getVar(${varName}, ${typeName})`, `${varName}=${val}`);

    // convert to expect type and return
    switch (typeName) {
      case 'string': {
        return val;
      }
      case 'number': {
        return parseInt(val + '', 10); // this could blow up, but that's ok since we'd want it to
      }
      default: {
        // we only want numbers or strings...
        this.doError(`getVar(${varName}, ${typeName})`, 'Argument Error', `Invalid variable type name: ${typeName}. Try 'string' or 'number' instead.`);
      }
    }
  };

  /**
   * Wrapping log.error to clean things up a little
   *
   * @param method
   * @param title
   * @param message
   */
  private doError(method: string, title: string, message: string) {
    const err = new Error(message);
    log.error(__filename, method, title + ' ->', err);
    throw err;
  }
}

export default Config;
