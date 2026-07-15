const express = require('express');
const path = require('path');
const { GreetingService } = require('./services/greetingService');
const { renderGreetingPage } = require('./services/greetingTemplate');

const app = express();
const port = process.env.PORT || 8080;

const greetingService = new GreetingService((msg) => console.log(msg));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get('/readyz', (req, res) => res.status(200).send('ready'));

app.all('/api/satdemofunc/:username', (req, res) => {
  const username = req.params.username;
  const result = greetingService.handle(username);
  const html = renderGreetingPage(username, result.message, 'Express \u2022 Node.js', '/');
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
