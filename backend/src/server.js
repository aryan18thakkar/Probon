import { app } from './app.js';
import { config } from './config/env.js';
import { runMigrations } from './db/migrate.js';

// Ensure migrations are run on startup
runMigrations();

const server = app.listen(config.port, () => {
  console.log(`ProjNaN Backend server running on http://localhost:${config.port} (env: ${config.nodeEnv})`);
});

export default server;
