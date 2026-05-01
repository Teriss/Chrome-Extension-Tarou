# build-load: 生产构建并加载到 Chrome

执行 `pnpm bp` 生产构建，检查构建产物，并输出加载到 Chrome 的步骤指引。

## 步骤

### 1. 执行生产构建

```bash
cd c:/code/Chrome-Extension-Tarou && pnpm bp
```

这会依次执行：清理 dist → Vite 主构建 → 复制 manifest 和图标 → 构建内容脚本和注入脚本

### 2. 检查构建结果

确认 `dist/` 目录下包含以下文件：
- `manifest.json`
- `background.js`
- `assets/sidePanel.js` + `assets/sidePanel.html`
- `assets/popup.js` + `assets/popup.html`
- `assets/combatPanel.js` + `assets/combatPanel.html`
- `content_script.mjs`
- `inject.js`
- 图标文件

### 3. 输出加载指引

告知用户：

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `c:\code\Chrome-Extension-Tarou\dist` 目录
5. 如果已加载过，点击刷新按钮即可更新

### 4. 如有构建错误

如果构建失败，分析错误信息并修复，然后重新构建。
