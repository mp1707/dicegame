const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure WASM is treated as an asset, not a source file (required for Rapier)
config.resolver.assetExts.push("wasm", "glb", "gltf");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== "wasm"
);

// Force 'three' to resolve to the root node_modules to ensure a single instance
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three") {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, "node_modules/three"),
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Enable require.context (some setups need this)
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
