# new-storage: 新增持久化存储项

在 `src/logic/storage.ts` 中添加新的 `useWebExtensionStorage` 持久化状态，同步更新类型定义。

## 输入

用户会提供以下信息，缺少的需要询问：
- 存储项名称（camelCase，如 `questTracker`）
- TypeScript 类型（如 `string[]`、`Partial<MyInterface>` 等）
- 默认值
- 所属分类（如 Dashboard、BattleLog、Drop、Party 等）

## 步骤

### 1. 定义类型（如需新类型）

如果类型是新接口，先在 `types/modules/extension.d.ts` 中定义：

```ts
interface MyNewType {
  field1: string
  field2: number
}
```

并在文件顶部的 import 中添加引用（如果有跨模块类型依赖）。

### 2. 添加存储项

编辑 `src/logic/storage.ts`：

```ts
// 在对应分类区域添加
export const myNewState = useWebExtensionStorage<MyType>('myNewState', defaultValue)
```

存储项按分类组织，插入到对应区域：
- `// Debugger` — 调试相关
- `// Setting` — 设置
- `// Dashboard` — 主页面板数据
- `// Evoker` — 贤者素材
- `// BattleLog` — 战斗日志
- `// Drop` — 掉落统计
- `// Party` — 编队
- `// MarkedUser` — 标记玩家
- `// Artifact` — 饰品
- `// Build` — 配置
- `// Gacha` — 抽卡

### 3. 验证类型

运行 `pnpm lint` 确认没有类型错误。

## 注意事项

- 存储项的 key 名（第一个参数字符串）应与变量名一致
- 默认值应与泛型类型匹配
- 复杂对象的默认值如果会被修改，使用 `deepClone()` 包裹以避免引用污染
- `storage.ts` 已导入了 `types/modules/extension.d.ts` 中的类型，新接口无需额外导入
