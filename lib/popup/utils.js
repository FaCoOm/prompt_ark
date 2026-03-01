// lib/popup/utils.js - Shared UI utilities
import { i18n } from '../../i18n-manager.js';

/**
 * Show a temporary toast notification.
 * @param {string} message - Text to display
 */
export function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create a debounced version of the given function.
 * @param {Function} func
 * @param {number} wait - Delay in milliseconds
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Render Markdown text to HTML using the global `marked` library.
 * Falls back to escaped HTML on parse failure.
 * @param {string} text
 * @returns {string}
 */
export function renderMarkdown(text) {
    if (!text) return '';
    try {
        return marked.parse(text);
    } catch (e) {
        return escapeHtml(text);
    }
}

/**
 * Format a timestamp as a localized relative time string.
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return i18n.t('timeAgoDays', { count: days }) || `${days}d ago`;
    if (hours > 0) return i18n.t('timeAgoHours', { count: hours }) || `${hours}h ago`;
    if (minutes > 0) return i18n.t('timeAgoMinutes', { count: minutes }) || `${minutes}m ago`;
    return i18n.t('timeAgoJustNow') || 'just now';
}
