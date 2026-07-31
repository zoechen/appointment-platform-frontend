const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 讓 Metro 也會看 workspace 根目錄（這樣才找得到 packages/core 的變動並即時 reload）
config.watchFolders = [workspaceRoot]

// 讓 Metro 依序在「App 自己的 node_modules」跟「workspace 根目錄的 node_modules」找套件，
// 這是 npm/yarn workspaces + Metro monorepo 的標準設定方式。
// 注意：不要加 disableHierarchicalLookup = true —— npm workspaces 預設會把共用套件
// （例如 expo-router）提升安裝到 monorepo 根目錄的 node_modules，
// 設定 disableHierarchicalLookup 會讓 Metro 完全不去查根目錄，直接找不到套件而報錯。
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
]

// 直接把 @app/core 指到實際的資料夾路徑，不依賴 npm workspaces 幫忙建立
// node_modules/@app/core 這個 symlink。這樣就算 npm install 沒有正確把
// workspace 套件連結起來，Metro 打包時還是找得到 @app/core，
// import { configure } from '@app/core' 這種寫法完全不用改。
//
// react / react-dom 也一起鎖定：如果 npm 在 packages/core/node_modules 底下
// 額外裝了一份 react（monorepo 常見狀況，通常是 zustand 的 peer dependency
// 被 npm 解析成獨立安裝），畫面就會同時載入兩個 React 實例，
// 造成 hooks（useRef/useState）因為對應不到正確的 renderer 而炸掉
// （錯誤訊息通常是 "Cannot read properties of null (reading 'useRef')"）。
// 強制指到 apps/mobile 這一份，確保整個 App 永遠只有一個 React 實例。
config.resolver.extraNodeModules = {
  '@app/core': path.resolve(workspaceRoot, 'packages/core/src'),
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom')
}

module.exports = config
