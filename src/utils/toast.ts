import { ToastItem } from '../types';

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyToast(toast: Partial<ToastItem> & { message: string; title?: string; type?: ToastItem['type'] } | string) {
  const item: ToastItem = typeof toast === 'string'
    ? {
        id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'info',
        title: '提示',
        message: toast,
        duration: 4000
      }
    : {
        id: toast.id || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: toast.type || 'info',
        title: toast.title || (toast.type === 'error' ? '操作失败' : toast.type === 'success' ? '操作成功' : toast.type === 'warning' ? '注意事项' : '系统提示'),
        message: toast.message,
        duration: toast.duration ?? (toast.type === 'error' ? 6000 : 4000),
        action: toast.action
      };

  listeners.forEach((listener) => {
    try {
      listener(item);
    } catch (e) {
      console.error('Toast listener error', e);
    }
  });

  // Also dispatch a DOM custom event for global decoupled listening
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('app_toast', { detail: item }));
    } catch (_) {}
  }

  return item.id;
}

export function showErrorToast(title: string, message: string, action?: { label: string; onClick: () => void }) {
  return notifyToast({
    type: 'error',
    title,
    message,
    duration: 6500,
    action
  });
}

export function showSuccessToast(title: string, message: string) {
  return notifyToast({
    type: 'success',
    title,
    message,
    duration: 3500
  });
}

export function showWarningToast(title: string, message: string, action?: { label: string; onClick: () => void }) {
  return notifyToast({
    type: 'warning',
    title,
    message,
    duration: 5000,
    action
  });
}

export function showInfoToast(title: string, message: string) {
  return notifyToast({
    type: 'info',
    title,
    message,
    duration: 3500
  });
}

/**
 * Parses and maps server / API errors into crystal-clear, friendly Chinese guidance
 */
export function formatApiErrorMessage(err: any, fallbackContext = 'AI 交互服务'): { title: string; message: string; isAuthError?: boolean } {
  const rawMsg = (err?.message || (typeof err === 'string' ? err : '')) || '未知错误';
  
  if (rawMsg.includes('401') || rawMsg.includes('UNAUTHENTICATED') || rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('鉴权失败')) {
    return {
      title: '🔑 API 鉴权未通过',
      message: '当前 API Key 无效或未开通权限。已为您智能尝试系统内置备用服务，您也可在“设置 (Settings)”中填入有效的 Google 或 OpenAI 密钥。',
      isAuthError: true
    };
  }

  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('额度超限')) {
    return {
      title: '⏳ 请求频次或额度已满 (429)',
      message: 'AI 接口请求过于频繁或免费额度已用尽。建议稍等 10-15 秒后重试，或在设置中切换为自己的 API Key。'
    };
  }

  if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('ECONNREFUSED') || rawMsg.includes('timeout')) {
    return {
      title: '🌐 网络连接受阻',
      message: '与后端服务的网络通信中断，请检查网络连接或稍后重试。'
    };
  }

  if (rawMsg.includes('500') || rawMsg.includes('Internal Server Error')) {
    return {
      title: `⚠️ ${fallbackContext}处理异常`,
      message: '服务端在处理该内容时遇到波动，系统已为您自动启动容错降级保护。'
    };
  }

  return {
    title: `⚠️ ${fallbackContext}提示`,
    message: rawMsg.length > 150 ? `${rawMsg.slice(0, 150)}...` : rawMsg
  };
}
