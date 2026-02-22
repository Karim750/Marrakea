import { mergeConfig, type UserConfig } from "vite";

export default (config: UserConfig) => {
  return mergeConfig(config, {
    server: {
      // Disable HMR completely to prevent refresh loops in Docker
      hmr: false,
      watch: {
        usePolling: false,
      },
    },
  });
};
