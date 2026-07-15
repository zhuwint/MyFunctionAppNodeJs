const { app } = require('@azure/functions');
const { GreetingService } = require('./services/greetingService');
const { renderGreetingPage } = require('./services/greetingTemplate');

const greetingService = new GreetingService((msg) => console.log(msg));

app.http('SATDemoFunc', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/satdemofunc/{username}',
  handler: async (request, context) => {
    const username = request.params.username;
    const result = greetingService.handle(username);
    const html = renderGreetingPage(username, result.message, 'Azure Functions \u2022 Node.js', '/index');

    return {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    };
  },
});

module.exports = app;
