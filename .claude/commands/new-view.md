# new-view: 新建侧边栏视图

在 `src/views/sidePanel/views/` 下创建一个新的视图页面，自动生成骨架组件并注册到导航栏。

## 输入

用户会提供视图名称（英文）和中文标签名。如果没有提供，请询问。

## 步骤

### 1. 创建视图目录和文件

根据用户指定的视图名（假设为 `xxx`），创建以下文件：

**`src/views/sidePanel/views/xxx/index.vue`** — 视图主组件：

```vue
<script setup lang="ts">
// TODO: 视图逻辑
</script>

<template>
  <div>
    <!-- TODO: 视图内容 -->
  </div>
</template>
```

### 2. 注册到侧边栏导航

编辑 `src/views/sidePanel/main.vue`，在 `upViewList` 数组中添加新视图条目：

```ts
{ key: 'xxx', label: '中文标签', icon: 'mdi:icon-name' },
```

图标使用 Iconify 格式，推荐从 Material Design Icons、Game Icons 等图标集中选择。

### 3. 验证

视图通过 `import.meta.glob('./views/*/index.vue')` 自动发现，无需额外注册。只需确保：
- 目录结构为 `src/views/sidePanel/views/xxx/index.vue`
- 文件名为 `index.vue`

## 注意事项

- 使用 `<script setup lang="ts">` 语法
- composables 和 Element Plus 组件无需手动导入
- 路径别名 `~/` = `src/`
- 使用 UnoCSS attributify 模式写样式（如 `p-10px`, `flex`, `items-center`）
- 如果视图需要持久化数据，在 `src/logic/storage.ts` 中添加对应的 `useWebExtensionStorage`
