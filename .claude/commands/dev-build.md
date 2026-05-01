# dev-build: 快速开发构建

执行 `pnpm ba` 开发模式构建，快速验证代码变更是否能通过编译。

## 步骤

### 1. 执行开发构建

```bash
cd c:/code/Chrome-Extension-Tarou && pnpm ba
```

### 2. 检查构建输出

- 确认无 TypeScript 编译错误
- 确认无 Vite 构建警告（除 chunk size 警告外）
- 如果有 lint 相关错误，运行 `pnpm lint` 查看详情

### 3. 报告结果

- 构建成功：告知用户可以加载 `dist/` 目录到 Chrome 测试
- 构建失败：分析错误并提供修复建议

## 与生产构建的区别

- `pnpm ba`：development mode，有 sourcemap，未压缩
- `pnpm bp`：production mode，压缩优化，适合发布
