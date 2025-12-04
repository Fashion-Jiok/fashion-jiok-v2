// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// 백엔드 폴더 이름
const backendFolder = 'backend';

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    blockList: [
      ...(defaultConfig.resolver.blockList || []),
      // 백엔드 폴더를 Metro bundler에서 제외
      new RegExp(`${backendFolder}/.*`),
      new RegExp(`.*/${backendFolder}/.*`),
    ],
  },
  watchFolders: [__dirname],
};