import pino from 'pino';
import path from 'path';

// Use CommonJS __dirname directly
const logFilePath = path.join(__dirname, 'app.log');

const fileTransport = pino.transport({
  target: 'pino/file',
  options: { destination: logFilePath },
});

const logger = pino(
  {
    level: 'info',
    base: { hostname: undefined },
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  fileTransport
);

export default logger;