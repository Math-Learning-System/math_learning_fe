import { useEffect, useState } from 'react';

/** Blob URL for a local PDF file; revoked automatically on change/unmount. */
export function useLocalPdfObjectUrl(file: File | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return objectUrl;
}
