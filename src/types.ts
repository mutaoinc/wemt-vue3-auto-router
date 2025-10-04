import type { Plugin } from "vite";

// 路由元信息类型
export interface RouteMeta {
  title?: string;
  hidden?: boolean;
  requiresAuth?: boolean;
  permissions?: string[];
  keepAlive?: boolean;
  params?: Record<string, any>;
  [key: string]: any;
}

// 路由命名规则配置
export interface NamingConfig {
  /** 是否使用kebab-case命名 */
  kebabCase?: boolean;
  /** 是否保留文件路径作为路由名 */
  preservePath?: boolean;
  /** 文件名后缀，如 ['View', 'Page'] */
  filenameSuffixes?: string[];
}

// 首页路由配置
export interface HomeRouteConfig {
  /** 首页路径 */
  path?: string;
  /** 首页名称 */
  name?: string;
  /** 首页文件名列表，默认为 ['home', 'index'] */
  fileNames?: string[];
}

// 404页面配置
export interface NotFoundConfig {
  /** 是否启用404页面 */
  enabled?: boolean;
  /** 404页面路径 */
  path?: string;
  /** 404页面名称 */
  name?: string;
  /** 404页面组件路径 */
  component?: string;
}

// 输出配置
export interface OutputConfig {
  /** 路由文件输出路径 */
  routes?: string;
  /** 配置文件输出路径 */
  config?: string;
  /** 守卫文件输出路径 */
  guards?: string;
}

// 插件配置接口
export interface AutoRouterOptions {
  /** 扫描的目录 */
  scanDir?: string;
  /** 文件扩展名 */
  extensions?: string[];
  /** 排除的文件模式 */
  exclude?: string[];
  /** 路径前缀 */
  pathPrefix?: string;
  /** 是否启用懒加载 */
  lazy?: boolean;
  /** 路由元信息 */
  meta?: RouteMeta;
  /** 路由命名规则 */
  naming?: NamingConfig;
  /** 首页路由配置 */
  homeRoute?: HomeRouteConfig;
  /** 默认页面标题 */
  defaultTitle?: string;
  /** 404页面配置 */
  notFound?: NotFoundConfig;
  /** 输出配置 */
  output?: OutputConfig;
}

// 内部使用的完整配置类型
export type InternalAutoRouterOptions = Required<AutoRouterOptions> & {
  output: Required<OutputConfig>;
  notFound: Required<NotFoundConfig>;
}

// 插件函数类型
export type AutoRouterPlugin = (options?: AutoRouterOptions) => Plugin;

// 工具函数类型
export type PathProcessor = (filePath: string, options: InternalAutoRouterOptions) => string;
export type ConfigMerger<T> = (defaultConfig: T, userConfig?: Partial<T>) => T;
