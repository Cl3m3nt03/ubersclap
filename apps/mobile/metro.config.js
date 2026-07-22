const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo : Metro doit surveiller la racine du workspace pour recompiler
// quand @ubersclap/shared change.
//
// On AJOUTE aux valeurs par defaut d'Expo au lieu de les remplacer : Expo
// detecte deja le monorepo et renseigne ses propres entrees. Les ecraser fait
// echouer `expo-doctor` et peut casser la resolution de ses modules internes.
config.watchFolders = [
  ...new Set([...(config.watchFolders ?? []), workspaceRoot]),
];

// Avec node-linker=hoisted (voir .npmrc), les dependances sont a la racine.
config.resolver.nodeModulesPaths = [
  ...new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ]),
];

module.exports = withNativeWind(config, { input: './global.css' });
