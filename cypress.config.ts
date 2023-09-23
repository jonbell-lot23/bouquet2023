import { defineConfig } from 'cypress';
import replay from '@replayio/cypress';

export default defineConfig({
  projectId: 'yktsmq',
  e2e: {
    setupNodeEvents: (on, config) => {
      // Install the replay plugin
      replay(on, config);

      return config;
    },
  },
});