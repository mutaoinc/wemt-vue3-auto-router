import { glob } from "glob";
import path from "path";
import fs from "fs";
import type { AutoRouterOptions, InternalAutoRouterOptions, RouteMeta } from "./types";

// 插件常量
export const PLUGIN_NAME = "vue-auto-router";
export const SUPPORTED_EXTENSIONS = [".vue", ".ts", ".js"];

// 默认配置
export const defaultOptions: InternalAutoRouterOptions = {
  scanDir: "src/views",
  extensions: [".vue"],
  exclude: ["**/components/**", "**/__tests__/**", "**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
  pathPrefix: "",
  lazy: true,
  meta: {},
  naming: {
    kebabCase: false,
    preservePath: false,
    filenameSuffixes: [],
  },
  homeRoute: {
    path: "/",
    name: "home",
  },
  defaultTitle: "",
  notFound: {
    enabled: true,
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: "src/views/404.vue",
  },
  output: {
    routes: "src/router/auto/routes.ts",
    config: "src/router/auto/config.ts",
    guards: "src/router/guards.ts",
  },
};

// 合并配置
export function mergeOptions(options?: AutoRouterOptions): InternalAutoRouterOptions {
  if (!options) return defaultOptions;

  return {
    ...defaultOptions,
    ...options,
    naming: { ...defaultOptions.naming, ...options.naming },
    homeRoute: { ...defaultOptions.homeRoute, ...options.homeRoute },
    notFound: { ...defaultOptions.notFound, ...options.notFound },
    output: { ...defaultOptions.output, ...options.output },
    meta: { ...defaultOptions.meta, ...options.meta },
  };
}

// 扫描文件
export async function scanFiles(options: InternalAutoRouterOptions, root: string): Promise<string[]> {
  const scanPath = path.resolve(root, options.scanDir);
  const pattern = path.join(scanPath, "**/*.{vue,ts,js}").replace(/\\/g, "/");

  const files = await glob(pattern, {
    ignore: options.exclude,
    absolute: true,
  });

  return files.filter(file => options.extensions.includes(path.extname(file)));
}

// 路径处理工具函数
export function generateRoutePath(filePath: string, options: InternalAutoRouterOptions): string {
  const relativePath = path.relative(path.resolve(process.cwd(), options.scanDir), filePath);
  const cleanPath = relativePath
    .replace(/\.(vue|ts|js)$/, "") // 移除文件扩展名
    .replace(/\/index$/, "") // 移除index文件名
    .replace(/^\/+/, "") // 移除开头的斜杠
    .replace(/\\/g, "/"); // 统一使用正斜杠

  const pathSegments = cleanPath.split("/").filter(Boolean);
  return pathSegments.map(segment => processPathSegment(segment, options.naming)).join("/");
}

// 处理路径段
function processPathSegment(segment: string, naming: InternalAutoRouterOptions["naming"]): string {
  let processed = segment;

  // 移除配置的文件名后缀
  if (naming.filenameSuffixes?.length) {
    for (const suffix of naming.filenameSuffixes) {
      if (suffix && processed.endsWith(suffix)) {
        processed = processed.slice(0, -suffix.length);
        break;
      }
    }
  }

  return naming.kebabCase ? toKebabCase(processed) : processed;
}

// 转换为kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

// 生成路由名称
export function generateRouteName(filePath: string, options: InternalAutoRouterOptions): string {
  const routePath = generateRoutePath(filePath, options);
  return routePath.replace(/\//g, "-");
}

// 生成页面标题
export function generatePageTitle(filePath: string, options: InternalAutoRouterOptions): string {
  const routePath = generateRoutePath(filePath, options);
  return routePath
    .split("/")
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

// 生成导入语句
export function generateImportStatement(filePath: string, options: InternalAutoRouterOptions): string {
  const routerDir = path.dirname(options.output.routes);
  const relativePath = path.relative(routerDir, filePath).replace(/\\/g, "/");
  return `() => import('${relativePath}')`;
}

// 解析Vue文件中的defineOptions
export function parseVueFileRouteMeta(filePath: string): RouteMeta | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const defineOptionsRegex = /defineOptions\s*\(\s*\{[\s\S]*?meta\s*:\s*(\{[\s\S]*?\})\s*[\s\S]*?\}\s*\)/;
    const match = content.match(defineOptionsRegex);

    if (!match) return null;

    const metaStr = match[1];
    return parseRouteMetaObject(metaStr);
  } catch (error) {
    console.warn(`Failed to parse meta in ${filePath}:`, error);
    return null;
  }
}

// 解析routeMeta对象字符串
function parseRouteMetaObject(objStr: string): RouteMeta {
  const cleanStr = objStr
    .replace(/\/\*[\s\S]*?\*\//g, "") // 移除块注释
    .replace(/\/\/.*$/gm, "") // 移除行注释
    .replace(/\s+/g, " ") // 压缩空白
    .trim();

  const result: RouteMeta = {};

  // 解析基本属性
  const patterns = {
    title: /title\s*:\s*['"`]([^'"`]*?)['"`]/,
    hidden: /hidden\s*:\s*(true|false)/,
    requiresAuth: /requiresAuth\s*:\s*(true|false)/,
    keepAlive: /keepAlive\s*:\s*(true|false)/,
  };

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = cleanStr.match(pattern);
    if (match) {
      const value = match[1];
      if (key === "title") {
        result[key] = value;
      } else {
        result[key] = value === "true";
      }
    }
  });

  if (cleanStr.includes("params")) {
    result.params = {};
  }

  return result;
}
