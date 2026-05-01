# release: 版本发布流程

更新 changelog 和版本号 → 生产构建 → 打包 ZIP → 生成 release notes。

## 输入

用户会提供以下信息，缺少的需要询问：
- 新版本号（如 `3.5.0`）
- 更新说明（一句话概括本次更新内容）

## 步骤

### 1. 更新 changelog.json

读取 `changelog.json`，在数组头部插入新版本条目：

```json
{
  "date": "YY.MM.DD",
  "version": "x.y.z",
  "comment": "更新说明"
}
```

日期格式为 `YY.MM.DD`（如 `26.05.02`）。

### 2. 更新 package.json 版本号

编辑 `package.json` 中的 `version` 字段为新版本号。

### 3. 执行生产构建

```bash
pnpm bp
```

确认构建成功。

### 4. 打包 ZIP

```bash
pnpm zip
```

这会在项目根目录生成 `Chrome-Extension-Tarou vx.y.z.zip` 文件。

### 5. 生成 Release Notes

从 `changelog.json` 中提取最新版本条目，输出 release notes 格式：

```
## vx.y.z (YY.MM.DD)

更新说明
```

### 6. 提示下一步

告知用户：
- ZIP 文件已生成在项目根目录
- 可以通过 `git commit` 提交变更
- 可以创建 git tag 并推送到 GitHub 触发自动发布：
  ```bash
  git tag vx.y.z
  git push origin vx.y.z
  ```
  GitHub Actions 会自动创建 Release 并上传 ZIP
