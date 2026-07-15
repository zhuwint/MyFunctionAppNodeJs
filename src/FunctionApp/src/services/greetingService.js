class GreetingService {
  constructor(log) {
    this._log = log || (() => {});
  }

  handle(username) {
    this._log(`HTTP request processed, username: ${username}`);
    return { message: `hello ${username}` };
  }
}

module.exports = { GreetingService };
