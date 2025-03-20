import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LOGS_FOLDER } from '../constants';

const ERROR = 0;
const WARN = 1;
const DEBUG = 2;
const LOG = 3;
const VERBOSE = 4;

const RADIX = 10;

export class CustomLogger implements LoggerService {
  private readonly logFile = path.join(LOGS_FOLDER, 'app.log');

  constructor() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  error(message: string, trace: string) {
    if (parseInt(process.env.LOG_LEVEL, RADIX) >= ERROR) {
      this.writeToFile('ERROR', `${message} - ${trace}`);
    }
    console.error(message);
  }

  warn(message: string) {
    if (parseInt(process.env.LOG_LEVEL, RADIX) >= WARN) {
      this.writeToFile('WARN', message);
    }
    console.warn(message);
  }

  debug(message: string) {
    if (parseInt(process.env.LOG_LEVEL, RADIX) >= DEBUG) {
      this.writeToFile('DEBUG', message);
    }
    console.debug(message);
  }

  log(message: string) {
    if (parseInt(process.env.LOG_LEVEL, RADIX) >= LOG) {
      this.writeToFile('LOG', message);
    }
    console.log(message);
  }

  verbose(message: string) {
    if (parseInt(process.env.LOG_LEVEL, RADIX) >= VERBOSE) {
      this.writeToFile('VERBOSE', message);
    }
    console.log(message);
  }

  private writeToFile(level: string, message: string) {
    const logEntry = `${new Date().toISOString()} [${level}] ${message}\n`;
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}
