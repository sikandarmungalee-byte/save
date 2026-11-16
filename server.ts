import app, { startServer } from './server/app.js';

if (!process.env.VERCEL) {
  startServer();
}

export default app;
