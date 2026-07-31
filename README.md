# 多平台預約管理系統 — 前端（Expo Universal App）

用 **Expo + Expo Router + react-native-web** 做成一套 universal app：
同一份程式碼同時跑 iOS / Android / 網頁（RWD），UI 元件用
**[@ant-design/react-native](https://github.com/ant-design/ant-design-mobile-rn)**
（官方支援 Web/iOS/Android 三端的 Ant Design Mobile React Native 版）。

## Monorepo 結構

```
appointment-platform-frontend/
  packages/core/         共用邏輯與狀態管理（zustand），不依賴任何 UI 框架
    src/
      apiClient.js         跨平台 fetch 封裝
      socketClient.js       Socket.IO 封裝
      authStore.js            登入狀態
      appointmentsStore.js     預約
      conversationsStore.js     對話（跨平台統一收件匣）
      channelsStore.js          三方通路綁定
      formatters.js              日期/時間/狀態顯示格式化（已有單元測試）
  apps/mobile/            Expo Router app（iOS / Android / Web 共用同一套畫面）
    app/                    檔案式路由
      login.js
      (tabs)/appointments/    列表・新增・詳情/編輯
      (tabs)/conversations/    列表・對話串
      (tabs)/account/           個人檔案・登出・三方通路綁定（對齊設計稿把通路綁定併進帳號頁）
    src/
      components/AppointmentForm.js
      useResponsive.js       RWD 斷點 hook
      useRealtimeSync.js       Socket.IO 事件轉發到各 store
      sessionStorage.js         登入狀態持久化（AsyncStorage，Web 會自動用 localStorage）
```

之所以拆成 `packages/core` + `apps/mobile` 兩層，是為了保留彈性：
現在雖然是同一份 UI 跑三端，但如果之後想拆一個「完全獨立的行銷官網」
或「純 Web 後台」，`packages/core` 的 API/狀態管理邏輯可以直接被
新的 `apps/xxx` 專案引用，不用重寫。

## 為什麼選 @ant-design/react-native

- 官方明確支援 **Web / iOS / Android**（底層就是 React Native + react-native-web），
  跟我們的 Expo universal app 架構直接契合，不需要額外做兼容處理。
- 元件是 Ant Design Mobile 規範，跟純網頁版的 antd（`antd`，不同套件）視覺語言一致，
  之後如果團隊還有其他用 antd 的網頁專案，設計語彙可以互通。

用到的元件：`Provider`（Modal/Toast 需要）、`Button`、`Card`、`List` /
`List.Item` / `InputItem`、`Modal.alert`、`Toast`、`WhiteSpace` / `WingBlank`。
聊天氣泡（對話串畫面）跟浮動的「新增預約」按鈕沒有對應的官方元件，
所以維持用原生 View/Pressable 手刻。

## 安裝與啟動

```bash
npm install   # 在 monorepo 根目錄執行，npm workspaces 會一次裝好 packages/core 與 apps/mobile

cp apps/mobile/.env.example apps/mobile/.env
# 編輯 apps/mobile/.env，填入後端 API 網址與 Google OAuth Client ID

npm run web       # 在瀏覽器開發（RWD 版）
npm run start      # 開 Expo Dev Tools，可選 iOS / Android 模拟器或實機
npm run ios         # 需要 macOS + Xcode
npm run android       # 需要 Android Studio / 模擬器
```

## 環境變數（`apps/mobile/.env`）

| 變數 | 說明 |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | 後端 REST API 網址（對應 `appointment-platform-backend`） |
| `EXPO_PUBLIC_REALTIME_URL` | Socket.IO 連線網址，通常跟 API 網址同一個 host |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `_ANDROID_CLIENT_ID` / `_WEB_CLIENT_ID` | Google Sign-In 各平台的 OAuth Client ID，見下方 |

## Google 登入設定

Expo 的 Google 登入（`expo-auth-session/providers/google`）**每個平台要用不同的
OAuth Client ID**：

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立三組 OAuth 用戶端 ID：
   - **iOS**：Bundle ID 填 `app.json` 裡的 `ios.bundleIdentifier`
   - **Android**：Package name 填 `app.json` 裡的 `android.package`，另外需要 SHA-1 憑證指紋
   - **Web**：這組同時給網頁版跟後端驗證 id_token 用，要跟後端 `.env` 的
     `GOOGLE_CLIENT_ID` 是**同一組**
2. 分別填入 `.env` 對應欄位。
3. 詳細步驟可參考 [Expo 官方 Google 登入指南](https://docs.expo.dev/guides/google-authentication/)（這塊 Expo 官方流程偶爾會調整，建議照當下最新文件走一次）。

## 測試

```bash
npm run test   # 目前涵蓋 packages/core 的 formatters.js 單元測試
```

`packages/core` 的 store（`authStore` / `appointmentsStore` 等）目前沒有自動化測試，
因為牽涉到呼叫後端 API 與 Socket.IO 連線；建議之後補上用 `msw`（Mock Service Worker）
模擬後端回應來測試 store 的行為。

## 疑難排解

### 瀏覽器出現 `Refused to execute script ... MIME type ('application/json')`

這代表 Metro 打包失敗，回傳的其實是 JSON 格式的錯誤訊息，瀏覽器把它當 JS 執行才報這個 MIME 錯誤——**這行 console 訊息本身不是根本原因**，要看兩個地方才找得到真正的錯誤：

1. 執行 `expo start` 的終端機視窗（真正的錯誤堆疊會印在這）
2. 直接把那個報 404 的網址貼到瀏覽器網址列打開，會顯示完整的 JSON 錯誤內容

常見成因（已經在這個專案修過一次，記錄下來備查）：

- **在 monorepo 根目錄直接執行 `npx expo start`**：Expo 找不到 `apps/mobile/package.json` 裡設定的 `"main": "expo-router/entry"`，退回舊版預設進入點去找根目錄的 `App.js`（不存在）而報錯。**一定要在 `apps/mobile` 目錄下執行**，或用根目錄的 `npm run web` / `npm run start`（會自動切換工作目錄）。
- **`metro.config.js` 設定了 `config.resolver.disableHierarchicalLookup = true`**：npm workspaces 預設會把共用套件（例如 `expo-router`）提升安裝到 monorepo 根目錄的 `node_modules`，而不是 `apps/mobile/node_modules`。`disableHierarchicalLookup` 會讓 Metro 完全不去查根目錄，導致這些套件全部找不到。這個專案目前的 `metro.config.js` **已經不設這個選項**；如果你在別的 monorepo 專案照抄範本時手滑加了這行，拿掉它就對了。
- **`package.json` 的 `"main": "expo-router/entry"`**：Expo CLI 對這個 magic string 有特殊處理，會用「相對路徑」解析 `expo-router` 的位置（例如 `./node_modules/expo-router/entry`），這個解析方式**不會**往上層目錄找，在 monorepo 底下如果 `expo-router` 被 npm workspaces 提升裝到根目錄（很常見），就永遠找不到而報錯——這是 Expo CLI 的已知 monorepo 問題。這個專案目前的修法是改用自訂的 `apps/mobile/index.js`（內容是 `import 'expo-router/entry'`），並把 `package.json` 的 `main` 改成 `"index.js"`；用一般的 `import` 語法解析套件路徑時，就會正常依照 `metro.config.js` 的 `nodeModulesPaths` 往上層目錄找，可以找到根目錄的 `expo-router`。
- 改完設定後，一定要加 `--clear` 重啟，清掉 Metro 快取，不然舊的錯誤結果可能還是被快取住：
  ```bash
  cd apps/mobile
  npx expo start --web --clear
  ```

### `npm install` 出現大量 `npm warn deprecated`

這些都只是套件本身標記為 legacy 的警告，不影響安裝與執行，可以忽略。裝完後執行 `npm audit` 看有沒有需要處理的安全性漏洞，非急迫可以之後再處理。

## 已知限制 / 待改進

1. **日期時間輸入是純文字框**（`YYYY-MM-DD` / `HH:mm`），還沒換成原生的日期時間選擇器；
   `AppointmentForm.js` 裡有說明為什麼先這樣做。
2. **時區處理簡化**：目前是把使用者裝置的當地時間直接組字串送給後端，
   沒有另外處理「店家設定時區」跟「裝置時區」不同的情況（跟後端設計文件列的
   待確認事項一致）。
3. **Facebook 綁定完成後不會自動偵測**：使用者授權完成回到 App 後，
   需要手動下拉重新整理「帳號」頁面才會看到新綁定的通路，
   之後可以改成 App 用 `Linking` 監聽 deep link 回跳自動刷新。
4. Tab 導覽用的是 Expo Router 內建的 `Tabs`（React Navigation），
   沒有用 antd-mobile-rn 自己的 `TabBar` 元件——兩者職責不同（一個是「畫面路由」，
   一個是「畫面內的分頁 UI」），混用容易衝突，所以導覽維持用 Expo Router 原生方式，
   只有畫面「內容」用 antd 元件。
5. 目前沒有寫 E2E 測試（例如 Detox / Playwright），這塊之後可以再補。
