const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin')

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    // 在 npm workspaces monorepo 結構下，babel-preset-expo 被提升安裝於根目錄 node_modules，
    // 而 expo-router 位於 apps/mobile/node_modules，導致 babel-preset-expo 內部的
    // require.resolve('expo-router') 找不到套件而漏掛 expoRouterBabelPlugin，
    // 進而使 _ctx.web.js 內的 process.env.EXPO_ROUTER_APP_ROOT 未被展開。
    // 這裡明確掛上 expoRouterBabelPlugin 確保路由根目錄常數正確編譯。
    plugins: [expoRouterBabelPlugin]
  }
}
