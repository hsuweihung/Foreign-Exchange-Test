# 初階外匯考古題練習網站

這是一個初階外匯考古題練習專案，支援第 44-46 屆題庫練習、收藏題目、作答紀錄與 Gemini 輔助解析。

## 專案結構

- `index.html`: 首頁與作答設定入口
- `exam.html`: 作答頁
- `history.html`: 作答紀錄頁
- `result.html`: 成績結果頁
- `saved.html`: 收藏題目頁
- `data.js`: 題庫資料

## 前端分層

- `assets/css/base.css`: 共用樣式、按鈕、drawer / chat 樣式
- `assets/css/*.css`: 各頁專屬樣式
- `assets/js/constants.js`: 共用常數、標籤、storage key
- `assets/js/storage.js`: localStorage 存取封裝
- `assets/js/common.js`: 共用互動工具與 Gemini API 呼叫
- `assets/js/index.js`: 首頁邏輯
- `assets/js/saved.js`: 收藏頁邏輯
- `assets/js/history.js`: 紀錄頁邏輯
- `assets/js/result.js`: 結果頁邏輯
- `assets/js/exam/`: 作答頁模組

## 作答頁模組

`exam` 頁目前是專案裡最完整的模組化範例。

- `assets/js/exam/core.js`: 解析 URL 參數、管理 state、建立題目池、保存/恢復 session
- `assets/js/exam/render.js`: 負責題目畫面、進度、書籤狀態、題目地圖 rendering
- `assets/js/exam/gemini.js`: 負責 Gemini drawer、提示詞建立後的互動流程、追問對話
- `assets/js/exam/app.js`: 負責事件綁定、交卷、跳題、重答、初始化流程

## 資料流

### 題庫資料

- 題庫來自 `data.js`
- `DATA[subject][session]` 會提供該科目、該屆的題目陣列
- `LABELS` 提供選項編號顯示

### 畫面流程

1. 使用者在 `index.html` 選擇屆別、科目、模式
2. 進入 `exam.html` 後由 `core.js` 建立題目清單
3. `render.js` 將目前題目與進度顯示到畫面
4. `app.js` 處理答題、翻頁、收藏、交卷
5. 交卷後寫入結果，再導向 `result.html`
6. `history.html` 讀取歷史紀錄並顯示圖表
7. `saved.html` 讀取收藏題目並可重新組成練習隊列

### localStorage 分工

所有 storage key 都集中在 `assets/js/constants.js`，實際讀寫由 `assets/js/storage.js` 統一處理。

主要資料如下：

- `saved_questions`: 收藏題目
- `saved_practice_queue`: 收藏題目練習清單
- `exam_history`: 作答紀錄
- `mistake_bank`: 錯題資料
- `last_result`: 最近一次結果摘要
- `last_exam_full`: 最近一次完整作答內容
- `exam_session_*`: 作答中暫存進度

## 共用層責任

### `constants.js`

適合放：
- 顯示文案常數
- storage key
- 科目名稱 / 模式名稱
- Gemini 共用訊息

不適合放：
- 畫面操作
- DOM 查找
- fetch 邏輯

### `storage.js`

適合放：
- `localStorage` 讀寫
- JSON parse / stringify 包裝
- 各種儲存資料的 getter / setter

不適合放：
- 頁面邏輯
- 畫面更新

### `common.js`

適合放：
- drawer 開關
- Gemini 共用請求流程
- chat message append / loading / typewriter
- 共用 prompt builder

不適合放：
- 特定頁面的 business logic

## 修改入口建議

想改功能時，優先看下面：

- 想改站名、共用文字、storage key：`assets/js/constants.js`
- 想改 localStorage 行為：`assets/js/storage.js`
- 想改 Gemini 對話流程：`assets/js/common.js`
- 想改首頁選擇邏輯：`assets/js/index.js`
- 想改作答流程：`assets/js/exam/`
- 想改收藏頁：`assets/js/saved.js`
- 想改紀錄頁：`assets/js/history.js`
- 想改結果頁：`assets/js/result.js`
- 想改全站共用外觀：`assets/css/base.css`
- 想改單頁視覺：對應的 `assets/css/*.css`

## 維護原則

- HTML 只保留結構與必要的 `id` / `class`
- CSS 集中在 `assets/css/`
- JS 集中在 `assets/js/`
- 不在 HTML 中寫 inline `style` 或 inline `onclick`
- 共用 key、標籤與設定值集中在 `constants.js`
- 共用 storage 邏輯集中在 `storage.js`
- 共用互動流程集中在 `common.js`
- 新功能若明顯變大，優先拆模組，不要把單一檔案繼續堆肥

## 編輯規範

- 檔案編碼統一使用 `UTF-8`
- 換行統一使用 `LF`
- 縮排統一使用 4 spaces
- 建議搭配 `.editorconfig` 與 `.vscode/settings.json` 維持一致設定
