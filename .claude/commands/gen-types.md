# gen-types: 生成游戏 API 类型定义

根据提供的 JSON 响应数据，生成 TypeScript 接口到 `types/modules/` 目录。

## 输入

用户会提供以下信息：
- JSON 数据（直接粘贴或文件路径）
- 目标类型文件（`source.d.ts`、`extension.d.ts`、`battle.d.ts`、`party.d.ts` 等）
- 接口名称

## 步骤

### 1. 分析 JSON 结构

- 识别所有字段及其类型
- 检测可选字段（值可能为 null/undefined）
- 检测嵌套对象和数组
- 注意 GBF 特有的数据模式：
  - 数字字符串（如 `"123"` 实际是 ID）
  - 布尔数字（`0`/`1` 表示 false/true）
  - 嵌套的 JSON 字符串（需要二次 parse）

### 2. 生成接口定义

在 `types/modules/` 对应文件中添加接口。遵循现有命名规范：

```ts
interface MyApiResponse {
  field1: string
  field2: number
  nested: {
    sub_field: string
  }
  list: ListItem[]
}
```

命名规范：
- 接口名使用 PascalCase
- 字段名尽量保持与游戏 API 原始字段一致（snake_case 或 camelCase 均可）
- 如果项目中已有类似接口，检查是否可以复用或扩展

### 3. 添加 export 声明

确保接口在对应模块的 `declare module 'xxx'` 块内，这样其他文件可以通过 `import type { Xxx } from 'xxx'` 引用。

### 4. 验证

运行 `pnpm lint` 确认类型定义无语法错误。

## 注意事项

- `types/modules/source.d.ts` — 游戏原始数据类型（API 请求/响应）
- `types/modules/extension.d.ts` — 扩展内部存储数据类型
- `types/modules/battle.d.ts` — 战斗相关类型
- `types/modules/party.d.ts` — 编队相关类型
- `types/modules/api.d.ts` — 后端 API 类型
- 如果字段含义明确，添加简短的 JSDoc 注释
- 避免使用 `any`，尽量推断具体类型
