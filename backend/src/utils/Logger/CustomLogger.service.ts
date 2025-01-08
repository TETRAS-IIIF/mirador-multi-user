import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class CustomLogger implements LoggerService {
  private readonly logFile = path.join(__dirname, '..', 'logs', 'app.log');

  constructor() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
  log(message: string) {
    if (parseInt(process.env.LOG_LEVEL, 10) > 2) {
      this.writeToFile('LOG', message);
    }
    console.log(message);
  }

  error(message: string, trace: string) {
    console.log(parseInt(process.env.LOG_LEVEL, 10));
    if (parseInt(process.env.LOG_LEVEL, 10) >= 0) {
      this.writeToFile('ERROR', `${message} - ${trace}`);
    }
    console.error(message);
  }

  warn(message: string) {
    if (parseInt(process.env.LOG_LEVEL, 10) > 0) {
      this.writeToFile('WARN', message);
    }
    console.warn(message);
  }

  debug(message: string) {
    if (parseInt(process.env.LOG_LEVEL, 10) > 1) {
      this.writeToFile('DEBUG', message);
    }
    console.debug(message);
  }

  verbose(message: string) {
    if (parseInt(process.env.LOG_LEVEL, 10) > 3) {
      this.writeToFile('VERBOSE', message);
    }
    console.log(message);
  }

  private writeToFile(level: string, message: string) {
    const logEntry = `${new Date().toISOString()} [${level}] ${message}\n`;
    try {
      fs.appendFileSync(this.logFile, logEntry);
      console.log(`Log written to file: ${logEntry}`);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
}
