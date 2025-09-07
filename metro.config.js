// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// You can customize the config here.
// For example, to add support for '.svg' files:
config.resolver.assetExts.push("svg");
config.resolver.sourceExts.push("mjs"); // Add 'mjs' for some libraries

module.exports = config;
