import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

interface DocxArticleViewerProps {
  fileUrl: string;
  className?: string;
}

const DocxArticleViewer: React.FC<DocxArticleViewerProps> = ({ fileUrl, className = '' }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bodyContainer = bodyRef.current;
    const styleContainer = styleRef.current;
    if (!bodyContainer || !styleContainer) return;

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      bodyContainer.innerHTML = '';
      styleContainer.innerHTML = '';

      try {
        const response = await fetch(fileUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Не удалось загрузить документ (${response.status})`);
        }

        const blob = await response.blob();

        if (cancelled) return;

        await renderAsync(blob, bodyContainer, styleContainer, {
          className: 'docx-article',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Ошибка загрузки документа');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fileUrl]);

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-red-700 mb-4">
          {error}
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 min-h-[120px]">
          <p className="text-text-secondary font-medium">Загрузка документа…</p>
        </div>
      )}
      {/* Контейнеры всегда в DOM — иначе после ошибки refs не монтируются и смена статьи не грузится */}
      <div ref={styleRef} aria-hidden="true" className={error ? 'hidden' : undefined} />
      <div
        ref={bodyRef}
        className={`docx-viewer overflow-x-auto [&_.docx-article-wrapper]:shadow-none [&_.docx-article-wrapper]:bg-transparent ${error ? 'hidden' : ''}`}
      />
    </div>
  );
};

export default DocxArticleViewer;