# 系統管理後台（Platform Admin）

跨租戶的最高權限管理後台，管理的是「所有使用這個系統的店家與員工」，
跟 `apps/mobile`（店家自己用的 App）是**完全獨立**的兩個系統——不同的登入方式、
不同的 API（`/admin/*`）、不同的 JWT，彼此不能互相冒用。詳細的後端設計在
`appointment-platform-backend` 的 README「十二、超級管理員後台」章節。

用純 **React + Vite**（不是 Expo/React Native），因為這是瀏覽器內部工具，
不需要跑 iOS/Android，用 Vite 可以避開 Metro/Expo 在 monorepo 下的一堆已知問題。

## 啟動

後端要先起來，而且要先用 CLI 建立一個超級管理員帳號（見後端 README）：

```bash
cd appointment-platform-backend
npm run create-admin -- admin@example.com "a-strong-password" "系統管理員"
npm start
```

前端：

```bash
# 在 monorepo 根目錄
npm install
cp apps/admin/.env.example apps/admin/.env
# 編輯 .env 確認 VITE_API_BASE_URL 指到後端網址

npm run admin
```

開啟 `http://localhost:5174`，用剛剛建立的超級管理員帳號登入。

## 頁面與功能

- **使用者管理**（`/staff`）：所有店家的所有員工，含即時在線狀態（WebSocket 連線數追蹤）、關鍵字搜尋、分頁瀏覽、角色編輯、以及客製確認對話框（`ConfirmModal`）停用／啟用帳號
- **店家管理**（`/businesses`）：所有租戶分頁列表，點進去看使用量統計（含 chatbot 回覆次數）跟對話記錄、可停用／啟用整個店家（停用後旗下員工立即斷線）
- **操作稽核紀錄**（`/audit-logs`）：分頁檢視超級管理員對店家與員工所做的所有變更軌跡（操作時間、管理員、動作類型、目標 ID 與變更內容）
