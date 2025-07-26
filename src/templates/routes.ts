import type { RouteRecordRaw } from "vue-router";

/**
 * 生成路由文件内容
 * @param routes 路由配置数组
 * @returns 路由文件的字符串内容
 */
export function generateRoutesTemplate(routes: RouteRecordRaw[]): string {
  const routesCode = routes.map(formatRouteCode).join(",\n");
  const timestamp = new Date().toISOString();

  return `import type { RouteRecordRaw } from 'vue-router'

// Auto-generated route configuration by @wemt/vue-auto-router
// Generated at: ${timestamp} 

export const autoRoutes: RouteRecordRaw[] = [
${routesCode}
]

export default autoRoutes

// HMR支持
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 [vue-auto-router] Routes updated')
  })
}
`;
}

/**
 * 格式化单个路由代码
 * @param route 路由配置对象
 * @returns 格式化后的路由代码字符串
 */
function formatRouteCode(route: RouteRecordRaw): string {
  const metaStr = formatMeta(route.meta);
  
  return `  {
    path: '${String(route.path)}',
    name: '${String(route.name)}',
    component: ${route.component},
    meta: ${metaStr}
  }`;
}

/**
 * 格式化meta对象
 * @param meta meta对象
 * @returns 格式化后的meta字符串
 */
function formatMeta(meta: any): string {
  if (!meta || Object.keys(meta).length === 0) {
    return '{}';
  }

  const entries = Object.entries(meta).map(([key, value]) => {
    const formattedValue = typeof value === 'string' ? `'${value}'` : JSON.stringify(value);
    return `      ${key}: ${formattedValue}`;
  });

  return `{
${entries.join(',\n')}
    }`;
}