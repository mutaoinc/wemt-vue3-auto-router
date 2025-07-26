import type { InternalAutoRouterOptions } from "../types";

/**
 * 生成配置文件内容
 * @param options 插件配置选项
 * @returns 配置文件的字符串内容
 */
export function generateConfigTemplate(options: InternalAutoRouterOptions): string {
  const config = {
    base: {
      pathPrefix: options.pathPrefix,
      lazy: options.lazy,
      meta: options.meta,
    },
    meta: {
      defaultTitle: options.defaultTitle,
      ...options.meta,
    },
    autoRoute: {
      scanDir: options.scanDir,
      extensions: options.extensions,
      exclude: options.exclude,
      naming: options.naming,
    },
    notFound: options.notFound,
  };

  return `// 自动生成的路由配置文件
export const routeConfig = ${JSON.stringify(config, null, 2)}

export default routeConfig
`;
}