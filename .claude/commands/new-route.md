# new-route: 新增数据路由

在 `src/composables/useDataCenter.ts` 的 `unpack()` 中添加新的 URL 匹配分支，处理游戏请求数据。

## 输入

用户会提供以下信息，缺少的需要询问：
- 目标 URL 路径片段（如 `/quest/start`、`/rest/gacha`）
- 用途说明（处理什么数据、更新哪个存储项）
- 是否需要解析 requestData（POST 请求体）
- 是否需要解析 responseData（响应数据）

## 步骤

### 1. 确认 URL 匹配模式

读取 `src/composables/useDataCenter.ts`，理解现有的 URL 匹配风格：
- 使用 `url.includes('/path/fragment')` 进行匹配
- 多个相关路由通常放在一起

### 2. 添加路由分支

在 `unpack()` 函数中合适的位置添加新的 `if` 分支：

```ts
// 功能说明
if (url.includes('/target/path')) {
  const payload = requestData ? JSON.parse(requestData) : null
  // 处理逻辑
  // 更新 storage 中的状态
  someStorageRef.value = processedData
}
```

### 3. 添加必要的 import

如果需要新的存储项或类型，在文件顶部添加导入：
- 存储项从 `~/logic` 导入
- 类型从 `extension`、`source`、`party` 等模块导入

### 4. 验证

运行 `pnpm lint` 确认类型正确。

## 注意事项

- `requestData` 是字符串，需要 `JSON.parse()` 解析
- `responseData` 已经是解析后的对象
- URL 匹配使用 `includes()`，注意避免过于宽泛的匹配
- 相关功能的路由应放在一起，添加注释标明用途
- 如果需要新增存储项，先使用 `/new-storage` 命令创建
