/**
 * Storage and Image Helper Utilities
 * Provides safe localStorage operations and HTML5 Canvas image downscaling/compression
 * to prevent QuotaExceededError and keep profile avatar storage compact (< 30KB).
 */

export function compressImage(
  fileOrDataUrl: File | string,
  maxWidth: number = 250,
  maxHeight: number = 250,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const processImg = (srcUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } else {
            resolve(srcUrl);
          }
        } catch (e) {
          resolve(srcUrl);
        }
      };
      img.onerror = () => resolve(srcUrl);
      img.src = srcUrl;
    };

    if (typeof fileOrDataUrl === "string") {
      processImg(fileOrDataUrl);
    } else if (fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = e.target?.result as string || "";
        processImg(rawResult);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve("");
    }
  });
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    console.warn(`localStorage setItem failed for key "${key}":`, e);
    // Attempt quota recovery by clearing legacy/orphaned keys or large caches
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== key && (k.includes("temp") || k.includes("guest") || k.endsWith("_cache"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error(`Quota recovery failed for key "${key}":`, err);
      return false;
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`localStorage getItem failed for key "${key}":`, e);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`localStorage removeItem failed for key "${key}":`, e);
  }
}
