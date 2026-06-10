/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync } = require("node:fs");
const path = require("node:path");
const { config: loadEnv } = require("dotenv");

const root = __dirname;
const searchPaths = [
  path.join(root, "..", "..", ".env"),
  path.join(root, "..", ".env"),
  path.join(root, ".env"),
];
for (const p of searchPaths) {
  if (existsSync(p)) {
    loadEnv({ path: p, override: true });
  }
}

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => {
  return {
    ...config, // 🚀 Pulls in everything from app.json perfectly
    slug: "safeborn-assistant",
    owner: "specisaac",
    extra: {
      ...config.extra // 🛡️ Crucial: Preserves the new projectId block so it doesn't read as undefined!
    }
  };
};