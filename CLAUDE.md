# Chrome Extension Tarou — GBF 游戏助手扩展

## 项目概述

为碧蓝幻想 (Granblue Fantasy) 开发的 Chrome 扩展 (Manifest V3)。通过拦截游戏 AJAX 请求和 WebSocket 帧，提供战斗日志、掉落追踪、编队管理、抽卡记录、活动监控等功能。面向中文 GBF 玩家社区，后端 API 域名 `itsuki.icu`。

## 构建与开发

```bash
pnpm dev          # 开发服务器 (端口 1234)
pnpm ba           # 开发构建 (development mode)
pnpm bp           # 生产构建 (production mode)
pnpm zip          # 打包 ZIP 发布文件
pnpm lint         # ESLint 检查
```

构建流程：三套 Vite 配置依次执行 — 主构建 (views + background) → 内容脚本 (IIFE) → 注入脚本 (IIFE)。`scripts/prepare.ts` 负责复制 manifest 和图标到 dist/。

## 技术栈

- **Vue 3** Composition API + `<script setup>` 语法
- **TypeScript** strict 模式，ESNext target
- **Vite 8** 三套独立配置：`vite.config.mts` (主)、`vite.config.content.mts`、`vite.config.inject.mts`
- **Element Plus** UI 组件库 (通过 `unplugin-vue-components` 自动导入)
- **UnoCSS** 原子化 CSS，启用 attributify / icons / directives
- **pnpm 10** 包管理，所有依赖均为 devDependencies (Vite 全量打包)
- **webext-bridge** 扩展各上下文间消息通信
- **cheerio** 解析游戏 DOM HTML

## 代码规范

- 路径别名 `~/` = `src/`
- composables 使用默认导出 (`export default function useXxx()`)
- 工具函数使用命名导出
- 使用 `lodash-es` 而非 `lodash`
- Vue composables 和 `@vueuse/core` 函数无需手动导入 (unplugin-auto-import)
- Element Plus 组件无需手动导入 (unplugin-vue-components)
- ESLint 配置：`@antfu/eslint-config`，启用 UnoCSS 插件
- UnoCSS shortcuts：`btn`、`icon-btn`、`fc` (flex center)

## 核心架构

### 三层脚本注入 (数据拦截)

```
游戏页面 jQuery ajaxSuccess
  → inject.js (页面上下文, CustomEvent)
  → content_script.mjs (内容脚本, webext-bridge)
  → background.js (Service Worker)
  → useDataCenter.unpack() 按 URL 路径分发处理
```

同时 background 通过 `chrome.debugger` API 拦截 WebSocket 帧获取实时战斗数据。

### 关键文件

| 文件 | 职责 |
|------|------|
| `src/background/index.ts` | Service Worker 入口，注册所有监听器 |
| `src/background/webRequest.ts` | HTTP 请求拦截 + DOM 抓取 |
| `src/background/debugger.ts` | Chrome debugger WebSocket 监听 |
| `src/contentScripts/index.ts` | 内容脚本：消息桥接 + DOM 抓取 + 加载 inject |
| `src/contentScripts/inject.ts` | 页面上下文：hook jQuery ajaxSuccess |
| `src/composables/useDataCenter.ts` | 核心数据中心 (~1890 行)，URL 路由处理所有游戏请求 |
| `src/composables/useBattleLog.ts` | 战斗日志解析 (~1001 行)，伤害统计/行动追踪 |
| `src/composables/useWebExtensionStorage.ts` | chrome.storage.local 响应式封装 |
| `src/logic/storage.ts` | 70+ 个持久化响应式状态定义 |
| `src/api/request.ts` | 后端 API fetch 封装，UUID 鉴权 |

### UI 入口 (三个独立 Vue 应用)

| 入口 | HTML | 用途 |
|------|------|------|
| Side Panel | `src/views/sidePanel/main.html` | 主界面，11+ 子视图 |
| Popup | `src/views/popup/main.html` | 弹窗工具 (饰品/配装/抽卡等) |
| Combat Panel | `src/views/combatPanel/main.html` | 浮动战斗面板 |

视图组件通过 `import.meta.glob` 动态注册，新增视图只需在 `src/views/` 下创建对应目录和 `main.ts`。

### 数据持久化

`useWebExtensionStorage` 将 `chrome.storage.local` 封装为 Vue `ref()`，自动双向同步，跨上下文（background/content/UI）共享状态。所有存储项定义在 `src/logic/storage.ts`。

### 后端 API

- 域名：开发 `localhost:3000`，生产 `https://www.itsuki.icu/api`
- 鉴权：UUID 存储在 `code` 字段，通过请求头发送
- 功能：掉落数据上传、配装分享/查询、活动数据同步

## 目录结构

```
src/
├── background/          # Service Worker (后台脚本)
│   ├── index.ts         # 入口：注册所有监听器
│   ├── webRequest.ts    # HTTP 请求拦截
│   ├── debugger.ts      # WebSocket 帧拦截
│   ├── action.ts        # 浏览器动作处理
│   ├── contextMenus.ts  # 右键菜单
│   ├── runtime.ts       # 安装/更新处理
│   └── tabs.ts          # Tab 生命周期
├── contentScripts/      # 内容脚本 + 注入脚本
│   ├── index.ts         # 内容脚本 (消息桥接)
│   └── inject.ts        # 页面注入 (jQuery hook)
├── composables/         # Vue composables (自动导入)
├── logic/               # 持久化存储定义
├── api/                 # 后端 API 接口
├── constants/           # 常量定义 (默认设置/活动/技能等)
├── styles/              # 全局样式
├── views/
│   ├── sidePanel/       # 主侧边栏 (dashboard/drop/combat/party/gacha 等)
│   ├── popup/           # 弹窗工具
│   └── combatPanel/     # 浮动战斗面板
├── components/          # 共享组件
└── assets/              # 静态资源
types/
└── modules/             # 类型定义 (extension/source/battle/party/api)
```

## 权限

`storage`、`unlimitedStorage`、`tabs`、`notifications`、`debugger`、`webRequest`、`contextMenus`、`scripting`、`sidePanel`

Host：`*.granbluefantasy.jp`、`gbf.game.mbga.jp`、`*.akamaized.net`、`localhost`、`*.itsuki.icu`
