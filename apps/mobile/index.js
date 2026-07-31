// 不要把 package.json 的 "main" 設回 "expo-router/entry"。
// Expo CLI 對這個 magic string 有特殊處理，會用「相對路徑」解析 expo-router 的位置
// （例如 ./node_modules/expo-router/entry），在 monorepo 底下如果 expo-router 是被
// npm workspaces 提升裝到根目錄的 node_modules（而不是 apps/mobile/node_modules），
// 這個相對路徑就會找不到檔案而報錯，是 Expo CLI 在 monorepo 下的已知問題。
//
// 這裡改成用一般的 import，就是正常的「套件名稱」解析，會依照 metro.config.js
// 設定的 nodeModulesPaths 往上層目錄找，可以正確找到根目錄的 expo-router。
import 'expo-router/entry'
