const { getDefaultConfig } = require('expo/metro-config')
const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const path = require('node:path')

// macOS 若未安裝 Watchman / fsevents，Metro 的 NodeWatcher 會對 node_modules 底下
// 上萬個子資料夾逐一呼叫 fs.watch，瞬間耗盡 macOS kqueue 檔案句柄上限並拋出 EMFILE。
// 這裡攔截針對 node_modules 內部子目錄的 fs.watch（保留檔案索引與專案原始碼的即時監聽），
// 徹底避免 EMFILE: too many open files, watch。
const originalFsWatch = fs.watch.bind(fs)
fs.watch = function patchedFsWatch(targetPath, options, listener) {
  if (typeof targetPath === 'string' && targetPath.includes(`${path.sep}node_modules`)) {
    const noopWatcher = new EventEmitter()
    noopWatcher.close = () => {}
    noopWatcher.ref = () => noopWatcher
    noopWatcher.unref = () => noopWatcher
    return noopWatcher
  }
  return originalFsWatch(targetPath, options, listener)
}

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 讓 Metro 也會看 workspace 根目錄（這樣才找得到 packages/core 的變動並即時 reload），
// 並排除無關的 apps/admin 與 .git 目錄，降低 macOS 檔案監聽句柄（file descriptors）消耗。
config.watchFolders = [workspaceRoot]
config.resolver.blockList = [
  new RegExp(`^${path.resolve(workspaceRoot, 'apps/admin').replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}/.*`),
  new RegExp(`^${path.resolve(workspaceRoot, '.git').replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}/.*`)
]

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

// 注意：Metro 的 extraNodeModules 只有在一般路徑解析「找不到」時才會生效；
// 當根目錄 node_modules 或 node_modules/expo/node_modules 底下存在另一份不同版本的
// react（例如 React 19.3.1 vs apps/mobile 的 React 18.2.0）時，一般解析會直接命中
// 根目錄那一份，造成同一個畫面混用 React 19 與 React 18 的 jsx-runtime（$$typeof 不相容）。
// 透過 resolveRequest 強制所有 react / react-dom 相關子路徑一律從 apps/mobile 解析。
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-dom' ||
    moduleName.startsWith('react-dom/')
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, 'index.js') },
      moduleName,
      platform
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
