// CampusFlow OS API — entry point.
require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { initSocket } = require('./socket');
const { router: agentRouter, startSweeper } = require('./routes/agent');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Initialize real-time Socket.IO subsystem
initSocket(server);

// Start the 5 s agent sweeper for monitoring offline agent deaths
startSweeper();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'campusflow-api' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/drives', require('./routes/drives'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/bookings', require('./routes/bookings'));
// resources.js defines /resources and /allocations paths, so it mounts at /api.
app.use('/api', require('./routes/resources'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/monitor', require('./routes/monitor'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/student', require('./routes/student'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/agent', agentRouter);

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Central error handler — always human sentences, never stack traces.
app.use((err, req, res, _next) => {
  console.error('[api-error]', err.message);
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const body = {
    error: status === 500 ? 'Something went wrong on the server.' : err.message || 'Something went wrong.',
  };
  if (err.explanation) body.explanation = err.explanation;
  res.status(status).json(body);
});

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`CampusFlow API listening on http://localhost:${PORT}/api`);
});

module.exports = { app, server };
