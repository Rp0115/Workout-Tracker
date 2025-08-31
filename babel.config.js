module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // This plugin is required for react-native-reanimated to work.
      "react-native-reanimated/plugin",
    ],
  };
};
