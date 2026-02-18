/**
 * Copy text to the user's clipboard.
 *
 * Uses the modern navigator.clipboard.writeText() API as primary method,
 * with a legacy document.execCommand('copy') fallback for older browsers.
 *
 * @returns true on success, false on failure. Never throws.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or other error — try fallback
    }
  }

  // Legacy fallback: document.execCommand('copy')
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
