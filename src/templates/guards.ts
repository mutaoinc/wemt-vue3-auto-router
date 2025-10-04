import type { InternalAutoRouterOptions } from "../types";

/**
 * 生成路由守卫文件内容
 * @param options 插件配置选项
 * @returns 守卫文件的字符串内容
 */
export function generateGuardsTemplate(options: InternalAutoRouterOptions): string {
  return `import type { Router } from 'vue-router'

/**
 * 路由守卫配置文件
 * 
 * 注意：此文件仅在首次生成时创建，之后不会被覆盖。
 * 您可以在此基础上自由修改和扩展。
 * 
 * 如果您删除了此文件，重新启动项目后会重新生成。
 */

// 路由守卫配置
const guardsConfig = {
  enabled: true,
  defaultTitle: "${options.defaultTitle || ""}",
}

/**
 * 设置路由守卫
 * @param router Vue Router 实例
 */
export function setupRouteGuards(router: Router) {
  if (!guardsConfig.enabled) {
    return
  }
  
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    const title = to.meta?.title as string || guardsConfig.defaultTitle
    if (title) {
      document.title = title
    }
    
    // 这里可以根据需要添加自定义的路由守卫逻辑
    // 例如：
    
    // 1. 检查登录状态
    // if (to.meta?.requiresAuth) {
    //   const isAuthenticated = checkAuthStatus()
    //   if (!isAuthenticated) {
    //     next('/login')
    //     return
    //   }
    // }
    
    // 2. 检查权限
    // if (to.meta?.permissions) {
    //   const hasPermission = checkPermissions(to.meta.permissions)
    //   if (!hasPermission) {
    //     next('/403')
    //     return
    //   }
    // }
    
    // 3. 检查自定义参数
    // if (to.meta?.params) {
    //   // 处理自定义参数逻辑
    // }
    
    next()
  })
  
  router.afterEach((to, from) => {
    // 路由切换完成后的处理
    console.log(\`Route changed from \${from.path} to \${to.path}\`)
    
    // 可以在这里处理页面分析、埋点等
    if (to.meta?.title) {
      console.log(\`Page title set to: \${to.meta.title}\`)
    }
    
    // 页面加载完成后的逻辑
    // trackPageView(to.path, to.meta?.title)
  })
}

// 导出配置供外部使用
export { guardsConfig }

// 工具函数示例（可选）
// function checkAuthStatus(): boolean {
//   return localStorage.getItem('token') !== null
// }

// function checkPermissions(requiredPermissions: string[]): boolean {
//   const userPermissions = getUserPermissions()
//   return requiredPermissions.every(permission => 
//     userPermissions.includes(permission)
//   )
// }

// function getUserPermissions(): string[] {
//   // 获取用户权限逻辑
//   return []
// }

// function trackPageView(path: string, title?: string): void {
//   // 页面访问统计逻辑
//   console.log('Page view:', { path, title })
// }
`;
}
