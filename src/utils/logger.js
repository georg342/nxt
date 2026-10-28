/**
 * Centralized logging utility.
 * Prepared for future integration with Sentry/Datadog by swapping the
 * internal transport without changing call sites.
 */
export const Logger = {
  info(context, message, data) {
    console.log(`[${context}] ${message}`, data ?? '')
  },
  warn(context, message, data) {
    console.warn(`[${context}] ${message}`, data ?? '')
  },
  error(context, message, data) {
    console.error(`[${context}] ${message}`, data ?? '')
  },
  debug(context, message, data) {
    console.debug(`[${context}] ${message}`, data ?? '')
  },
}
