/**
 * Expo config — loads .env from several locations (later files override) so a single
 * file at repo root or frontend/ is enough; mobile/.env wins for the same key.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { existsSync, readFileSync } = require("node:fs");
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

const appJson = JSON.parse(readFileSync(path.join(root, "app.json"), "utf8"));

/** @type {import('@expo/config').ExpoConfig} */
module.exports = { expo: appJson.expo };
