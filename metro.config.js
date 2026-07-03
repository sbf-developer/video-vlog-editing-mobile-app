const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ignore optional platform-specific packages missing on Windows.
config.resolver.blockList = [
  /node_modules\\lightningcss-darwin-x64/,
  /node_modules\\lightningcss-linux-x64-gnu/,
  /node_modules\\lightningcss-linux-arm64-gnu/,
  /node_modules\\lightningcss-linux-arm-gnueabihf/,
  /node_modules\\lightningcss-freebsd-x64/,
];

module.exports = config;
