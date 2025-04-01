"use client";

export const AUTH_TOKEN_KEY = "auth_token";

/**
 * 安全地获取localStorage中的值
 * @param key 存储的键名
 * @returns 存储的值或null
 */
export const getLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    // 在客户端环境中获取localStorage的值
    console.log(`getLocalStorage: ${key}`, localStorage.getItem(key));
    
    return localStorage.getItem(key);
  }
  return null;
};

/**
 * 安全地设置localStorage中的值
 * @param key 存储的键名
 * @param value 要存储的值
 */
export const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

/**
 * 安全地移除localStorage中的值
 * @param key 要移除的键名
 */
export const removeLocalStorage = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};
