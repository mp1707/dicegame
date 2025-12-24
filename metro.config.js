const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow importing .glb models
config.resolver.assetExts.push("glb");

// Enable require.context (some setups need this)
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
