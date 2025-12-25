const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure WASM is treated as an asset, not a source file (required for Rapier)
config.resolver.assetExts.push("wasm", "glb", "gltf");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== "wasm"
);

// Enable require.context (some setups need this)
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
