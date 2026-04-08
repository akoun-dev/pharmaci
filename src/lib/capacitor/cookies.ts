/**
 * Cookies - Wrapper pour la gestion des cookies
 *
 * Note: Capacitor gère les cookies automatiquement via le WebView.
 * Ce wrapper fournit des utilitaires pour gérer les cookies côté web
 * et interagir avec les cookies HTTP.
 *
 * Documentation: https://capacitorjs.com/docs/guides/storage#cookies
 */

import { Capacitor } from '@capacitor/core';

/**
 * Interface pour un cookie
 */
export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Vérifie si nous sommes sur le web
 */
const isWeb = Capacitor.getPlatform() === 'web';

/**
 * Définit un cookie
 * @param name - Nom du cookie
 * @param value - Valeur du cookie
 * @param options - Options du cookie
 */
export const setCookie = (
  name: string,
  value: string,
  options: Partial<Cookie> = {}
): void => {
  if (!isWeb) {
    console.warn('Cookie management on native platforms uses WebView HTTP cookies');
    return;
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Récupère un cookie
 * @param name - Nom du cookie
 * @returns Valeur du cookie ou null
 */
export const getCookie = (name: string): string | null => {
  if (!isWeb) {
    console.warn('Cookie management on native platforms uses WebView HTTP cookies');
    return null;
  }

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
};

/**
 * Supprime un cookie
 * @param name - Nom du cookie
 * @param options - Options pour identifier le cookie (domain, path)
 */
export const deleteCookie = (name: string, options: { domain?: string; path?: string } = {}): void => {
  if (!isWeb) {
    console.warn('Cookie management on native platforms uses WebView HTTP cookies');
    return;
  }

  setCookie(name, '', {
    ...options,
    expires: new Date(0),
    maxAge: -1,
  });
};

/**
 * Récupère tous les cookies
 * @returns Objet avec tous les cookies
 */
export const getAllCookies = (): Record<string, string> => {
  if (!isWeb) {
    console.warn('Cookie management on native platforms uses WebView HTTP cookies');
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (const cookieString of cookieStrings) {
    const separatorIndex = cookieString.indexOf('=');
    if (separatorIndex >= 0) {
      const name = decodeURIComponent(
        cookieString.substring(0, separatorIndex).trim()
      );
      const value = decodeURIComponent(
        cookieString.substring(separatorIndex + 1)
      );
      cookies[name] = value;
    }
  }

  return cookies;
};

/**
 * Supprime tous les cookies
 */
export const clearAllCookies = (): void => {
  if (!isWeb) {
    console.warn('Cookie management on native platforms uses WebView HTTP cookies');
    return;
  }

  const cookies = getAllCookies();
  for (const name in cookies) {
    deleteCookie(name);
  }
};

/**
 * Vérifie si un cookie existe
 * @param name - Nom du cookie
 * @returns true si le cookie existe
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Utilitaires pour gérer les cookies d'authentification
 */
export const AuthCookies = {
  /**
   * Définit le cookie de session
   */
  setSession: (token: string, expiresIn?: number): void => {
    const options: Partial<Cookie> = {
      secure: true,
      sameSite: 'strict',
      path: '/',
    };

    if (expiresIn) {
      options.expires = new Date(Date.now() + expiresIn * 1000);
    }

    setCookie('session', token, options);
  },

  /**
   * Récupère le cookie de session
   */
  getSession: (): string | null => {
    return getCookie('session');
  },

  /**
   * Supprime le cookie de session
   */
  clearSession: (): void => {
    deleteCookie('session', { path: '/' });
  },

  /**
   * Définit le cookie de refresh token
   */
  setRefreshToken: (token: string, expiresIn?: number): void => {
    const options: Partial<Cookie> = {
      secure: true,
      sameSite: 'strict',
      path: '/',
    };

    if (expiresIn) {
      options.expires = new Date(Date.now() + expiresIn * 1000);
    }

    setCookie('refresh_token', token, options);
  },

  /**
   * Récupère le cookie de refresh token
   */
  getRefreshToken: (): string | null => {
    return getCookie('refresh_token');
  },

  /**
   * Supprime le cookie de refresh token
   */
  clearRefreshToken: (): void => {
    deleteCookie('refresh_token', { path: '/' });
  },
};

/**
 * Export de l'API
 */
export const Cookies = {
  get: getCookie,
  set: setCookie,
  delete: deleteCookie,
  getAll: getAllCookies,
  clearAll: clearAllCookies,
  has: hasCookie,
  auth: AuthCookies,
};
