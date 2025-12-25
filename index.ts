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

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
