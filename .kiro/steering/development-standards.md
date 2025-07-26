---
inclusion: always
---

# Vue 3 + Vite 自动路由生成插件开发规范

## 项目架构

**技术栈**: TypeScript 5.x + Rollup + Vite 插件 + Vue Router 4.x

**核心模块**:
- `src/generator.ts` - 路由生成核心逻辑
- `src/index.ts` - Vite 插件入口
- `src/types.ts` - 类型定义
- `src/utils.ts` - 工具函数

## 代码规范

### TypeScript 要求
- 启用严格模式，禁用 `any` 类型
- 公共 API 必须有完整类型定义
- 使用接口定义复杂类型结构
- 工具函数优先使用泛型

### 错误处理模式
```typescript
// 必须包含错误处理的异步操作
try {
  await fileOperation()
} catch (error) {
  console.error('File operation failed:', error)
  throw new Error(`Context: ${error.message}`)
}
```

### 性能优化策略
- 文件监听：实现防抖机制
- 路由生成：采用增量更新
- 文件操作：使用流式处理
- 计算结果：实现缓存机制

## Vite 插件开发

### 插件结构
- 使用 kebab-case 命名
- 实现标准生命周期钩子：`buildStart`, `buildEnd`, `handleHotUpdate`
- 区分开发/生产环境行为
- 提供完整配置选项和合理默认值

### 文件系统操作
- 使用 Node.js 内置 `fs`, `path` 模块
- 路径处理确保跨平台兼容
- 利用 Vite 内置 watcher 进行文件监听

## 构建配置

### Rollup 输出
- 双格式：CommonJS + ESM
- 外部依赖不打包
- 生成 source map
- 独立类型声明文件

### 版本管理
遵循语义化版本：`MAJOR.MINOR.PATCH`
- 破坏性变更 → 主版本
- 新功能 → 次版本  
- Bug 修复 → 修订版本