const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
const logger = createLogger({
  level: "info",
  format: combine(label({ label: "Log" }), timestamp(), myFormat),
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.File({ filename: "log/info.log", level: "info" }),
    new transports.File({ filename: "log/error.log", level: "error" }),
  ],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new transports.Console({
//       format: format.simple(),
//     })
//   );
// }

module.exports = logger;
