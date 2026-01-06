// Polyfills MUST be at the very top for Rapier WASM compatibility
// polywasm provides WebAssembly implementation for Hermes (which doesn't have native WASM support)
// We must manually assign it to globalThis since polywasm doesn't do this automatically
import { WebAssembly } from "polywasm";
(globalThis as any).WebAssembly = WebAssembly;

// crypto.getRandomValues polyfill (required by react-native-polyfill-globals)
import "react-native-get-random-values";

// General polyfills for Node.js globals
import "react-native-polyfill-globals/auto";

import { registerRootComponent } from "expo";
import App from "./App";

// Suppress known warnings/logs from Expo/Three.js integration
const originalWarn = console.warn;
const originalLog = console.log;

console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === "string") {
    // Suppress "deprecated parameters" warning from expo-gl
    if (
      msg.includes(
        "using deprecated parameters for the initialization function"
      )
    )
      return;
    // Suppress EXT_color_buffer_float warning
    if (msg.includes("EXT_color_buffer_float extension not supported")) return;
  }
  originalWarn(...args);
};

console.log = (...args) => {
  const msg = args[0];
  if (typeof msg === "string") {
    // Suppress verbose GL pixelStorei logs
    if (
      msg.includes("pixelStorei") &&
      msg.includes("doesn't support this parameter")
    )
      return;
  }
  originalLog(...args);
};

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
