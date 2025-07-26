# @wemt/vue3-auto-router

**简体中文** | [English](./README_en.md)

一个专为 Vue 3 + Vite 项目设计的自动路由生成插件，能够根据文件系统结构自动生成 Vue Router 配置。

## ✨ 功能特性

- 🚀 **智能路由生成**: 基于文件系统结构自动生成 Vue Router 配置，告别手动维护路由
- 👁️ **实时文件监听**: 开发模式下智能监听文件变化，自动重新生成路由配置
- ⚙️ **高度可定制**: 提供丰富的配置选项，完全满足不同项目的个性化需求
- 🛡️ **路由守卫集成**: 自动生成基础路由守卫，支持权限控制和页面标题设置
- 📝 **元信息支持**: 支持在 Vue 组件中使用 `defineOptions` 定义路由元信息
- ⚡ **性能优化**: 默认启用组件懒加载，显著提升应用加载性能
- 🪶 **轻量级设计**: 最小化依赖，极小的包体积，不影响项目构建速度
- 🔧 **TypeScript 支持**: 完整的 TypeScript 类型定义，提供良好的开发体验

## 📦 安装

```bash
npm install @wemt/vue3-auto-router
# 或
yarn add @wemt/vue3-auto-router
# 或
pnpm add @wemt/vue3-auto-router
```

## 🚀 快速开始

### 1. 配置 Vite 插件

在 `vite.config.ts` 中配置插件：

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { vueAutoRouter } from "@wemt/vue3-auto-router";

export default defineConfig({
  plugins: [
    vue(),
    vueAutoRouter({
      // 可选配置
      scanDir: "src/views",
      defaultTitle: "我的应用",
    }),
  ],
});
```

### 2. 配置路由

在 `src/router/index.ts` 中配置自动路由：

```typescript
import { createRouter, createWebHistory } from "vue-router";
import autoRoutes from "./auto/routes"; // 自动生成的路由配置
import { setupRouteGuards } from "./guards"; // 自动生成的路由守卫

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 你的自定义路由
    {
      path: "/custom",
      name: "custom",
      component: () => import("@/views/Custom.vue"),
    },
    // 自动生成的路由
    ...autoRoutes,
  ],
});

// 设置路由守卫
setupRouteGuards(router);

export default router;
```

### 3. 创建页面文件

在 `src/views` 目录下创建你的页面文件：

```
src/views/
├── Home.vue          # 路由: /home
├── About.vue         # 路由: /about
├── user/
│   ├── Profile.vue   # 路由: /user/profile
│   └── Settings.vue  # 路由: /user/settings
└── 404.vue          # 404 页面
```

### 4. 在 Vue 组件中定义路由元信息

```vue
<template>
  <div class="user-profile">
    <h1>用户资料</h1>
    <!-- 页面内容 -->
  </div>
</template>

<script setup lang="ts">
// 定义路由元信息
defineOptions({
  meta: {
    title: "用户资料",
    params: {
      requiresAuth: true,
      keepAlive: true,
    },
  },
});

// 组件逻辑
const userInfo = ref({});
</script>
```

## 📁 推荐的项目结构

```
src/
├── views/                    # 页面组件目录
│   ├── Home.vue             # 首页
│   ├── About.vue            # 关于页面
│   ├── user/                # 用户相关页面
│   │   ├── Profile.vue      # 用户资料
│   │   └── Settings.vue     # 用户设置
│   └── 404.vue             # 404 页面
├── router/                  # 路由配置目录
│   ├── index.ts            # 主路由文件
│   ├── guards.ts           # 路由守卫（自动生成）
│   └── auto/               # 自动生成的路由文件
│       ├── routes.ts       # 路由配置
│       └── config.ts       # 配置信息
└── components/             # 公共组件（不会被扫描为路由）
```

## ⚙️ 详细配置

### 基础配置

```typescript
vueAutoRouter({
  // 扫描目录，默认为 "src/views"
  scanDir: "src/views",

  // 支持的文件扩展名，默认为 [".vue"]
  extensions: [".vue", ".ts", ".js"],

  // 排除的文件模式
  exclude: ["**/components/**", "**/__tests__/**", "**/.*"],

  // 路由路径前缀
  pathPrefix: "",

  // 是否启用懒加载，默认为 true
  lazy: true,

  // 默认页面标题
  defaultTitle: "我的应用",

  // 全局路由元信息
  meta: {
    params: {
      requiresAuth: false,
      keepAlive: false,
    },
  },
});
```

### 命名规则配置

```typescript
vueAutoRouter({
  naming: {
    // 是否使用 kebab-case 命名，默认为 false
    kebabCase: true,

    // 是否保留文件路径作为路由名，默认为 false
    preservePath: false,

    // 文件名后缀，会在生成路由名时移除
    filenameSuffixes: ["View", "Page"],
  },
});
```

### 首页路由配置

```typescript
vueAutoRouter({
  homeRoute: {
    path: "/", // 首页路径，默认为 "/"
    name: "home", // 首页名称，默认为 "home"
  },
});
```

### 404 页面配置

```typescript
vueAutoRouter({
  notFound: {
    enabled: true, // 是否启用 404 页面，默认为 true
    path: "/:pathMatch(.*)*", // 404 页面路径
    name: "not-found", // 404 页面名称
    component: "src/views/404.vue", // 404 页面组件路径
  },
});
```

### 输出文件配置

```typescript
vueAutoRouter({
  output: {
    routes: "src/router/auto/routes.ts", // 路由文件输出路径
    config: "src/router/auto/config.ts", // 配置文件输出路径
    guards: "src/router/guards.ts", // 守卫文件输出路径
  },
});
```

## 🛡️ 路由守卫

插件会自动生成基础的路由守卫文件，你可以在此基础上进行自定义：

```typescript
import type { Router } from "vue-router";

// 模拟登录状态检查函数
function isAuthenticated(): boolean {
  return localStorage.getItem("token") !== null;
}

export function setupRouteGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    const title = to.meta?.title as string;
    if (title) {
      document.title = title;
    }

    // 检查是否需要登录
    if (to.meta?.params?.requiresAuth) {
      if (!isAuthenticated()) {
        next("/login");
        return;
      }
    }

    // 检查权限
    if (to.meta?.params?.permissions) {
      const userPermissions = getUserPermissions();
      const requiredPermissions = to.meta.params.permissions as string[];

      if (!hasPermissions(userPermissions, requiredPermissions)) {
        next("/403");
        return;
      }
    }

    next();
  });

  router.afterEach((to, from) => {
    // 路由切换完成后的处理
    console.log(`Route changed from ${from.path} to ${to.path}`);

    // 页面分析、埋点等
    if (to.meta?.title) {
      console.log(`Page title set to: ${to.meta.title}`);
    }
  });
}
```

## 🔧 高级用法

### 动态路由
开发中

### 过渡动画
开发中

### 路由缓存
开发中


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT](https://opensource.org/licenses/MIT)

## 👨‍💻 作者

**Mutaoinc & Wemt Team**

---

如果这个工具对你有帮助，请给个 ⭐ Star 支持一下！
