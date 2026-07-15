const { app } = require('@azure/functions');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

app.http('SATDemoFunc', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/satdemofunc/{username}',
  handler: async (request, context) => {
    context.log(`HTTP request processed, username: ${request.params.username}`);
    return {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html,
    };
  },
});

module.exports = app;
