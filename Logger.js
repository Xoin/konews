const { loglevel } = require("./port");

// Simple console function
function Logger(type, level, message) {
  if (level <= loglevel) {
    console.log(type + "." + level + ": " + message);
  }
}
exports.Logger = Logger;
