"use client";

import { NextRequest, NextResponse } from "next/server";
import { i18n } from "./i18n-config";
import { AUTH_TOKEN_KEY, getLocalStorage } from "./lib/storage";

// 获取用户语言偏好
function getLocale(request: NextRequest): string {
  // 获取请求头中的 accept-language 字段
  const acceptLanguage = request.headers.get("accept-language");
  const languages = acceptLanguage ? acceptLanguage.split(",") : [];
  // 可用的语言列表
  const locales: string[] = i18n.locales as unknown as string[];

  // 开始匹配语言
  for (const lang of languages) {
    const language = lang.split(";")[0].trim().toLowerCase(); // 处理优先级，提取语言代码
    if (locales.includes(language)) {
      return language;
    }
  }

  // 未匹配上，返回默认语言
  return i18n.defaultLocale;
}

// 中间件
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let isWebview = true;
  // 尝试调用 DJI 接口判断是否为 Webview
  try {
    const res = window.djiBridge.platformVerifyLicense("", "", "");
    console.log(res);
  } catch (error) {
    console.log(error);
    isWebview = false;
  }

  // 检查登录状态
  const token = request.cookies.get(AUTH_TOKEN_KEY) || getLocalStorage(AUTH_TOKEN_KEY);
  if (!token) {
    console.log("未登录");
    // pathname 含有 login 的情况下，跳过
    if (pathname.split("/").includes("login")) {
      console.log("跳过登录检查");
      return NextResponse.next();
    }
    console.log("重定向到登录页");

    const url = isWebview ? "/pilot/login" : "/login";
    return NextResponse.redirect(new URL(url, request.url));
  }

  // 如果以 /pilot 开头，跳过
  if (pathname.startsWith("/pilot")) {
    return NextResponse.next();
  }

  // 如果以 /login 开头，跳过
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // 检查路径是否缺少语言前缀
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // 无语言前缀，重定向
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`,
        request.url
      )
    );
  }
}

// 配置中间件的匹配规则
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"], // 排除 API 请求和静态文件
};
