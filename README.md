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
