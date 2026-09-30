/** Fail-safe minimum redaction for demo conversation history and provider payloads.
 * A production DLP classification review is still required before external data is allowed. */
export function redactConversationText(value: string): string {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/gi, '[已隐藏密钥]')
    .replace(/(?<!\d)[1-9]\d{16}[\dXx](?!\d)/g, '[已隐藏身份证号]')
    .replace(/(?<!\d)\d{16,19}(?!\d)/g, '[已隐藏银行卡号]')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[已隐藏手机号]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[已隐藏邮箱]');
}
