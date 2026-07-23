import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Clock,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { coordsKey, readCache, writeCache } from '@/utils/geoCache';
import { useNavigationStore } from '@/store/navigationStore';
import { documentsApi, mapApi } from '@/api';
import {
  mapBackendDocument,
  mapBackendDocumentSource,
  mapBackendPlaceCategory,
} from '@/api/mappers';
import type { DocumentItem, DocumentSource, PlaceCategory } from '@/types';

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDocsList(docs: DocumentItem[]): string {
  return docs
    .map((doc, i) => {
      const lines = [`${i + 1}. ${doc.title}${doc.required ? ' (обязательно)' : ''}`];
      doc.note.forEach((n) => lines.push(`   ${n}`));
      return lines.join('\n');
    })
    .join('\n\n');
}

function buildSourceDownloadContent(source: DocumentSource, docs: DocumentItem[]): string {
  return [source.downloadHeader, '', 'Список документов:', '', formatDocsList(docs), ''].join(
    '\n'
  );
}

function buildAllSourcesDownloadContent(
  groups: { source: DocumentSource; docs: DocumentItem[] }[]
): string {
  const parts = [
    'Полный список документов для продажи недвижимости',
    'Документы сгруппированы по местам получения.',
    '',
  ];
  groups.forEach(({ source, docs }, index) => {
    if (index > 0) parts.push('', '─'.repeat(40), '');
    parts.push(source.downloadHeader, '', 'Список документов:', '', formatDocsList(docs));
  });
  parts.push('');
  return parts.join('\n');
}

const docKey = (doc: DocumentItem) => (doc.id != null ? String(doc.id) : doc.title);


function yandexMapsUrl(place: {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}): string | null {
  if (place.latitude == null || place.longitude == null) return null;

  const point = `${place.longitude},${place.latitude}`;
  const label = [place.name, place.address].filter(Boolean).join(', ');

  return (
    'https://yandex.ru/maps/?' +
    `pt=${point},pm2rdm&z=17&text=${encodeURIComponent(label)}`
  );
}

const Step2Page: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { checkedDocuments, toggleDocument, setCheckedDocuments } = useAppStore();
  const { algorithmsBackRoute, setAlgorithmsBackRoute, setMaterialsBackRoute } =
    useNavigationStore();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentSources, setDocumentSources] = useState<DocumentSource[]>([]);
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  // Данные OSM получить не удалось — отличаем от "офисов нет рядом".
  const [placesFailed, setPlacesFailed] = useState(false);
  const selectedLocation = useAppStore((s) => s.selectedLocation);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const officesKey = selectedLocation
          ? coordsKey(selectedLocation.latitude, selectedLocation.longitude)
          : '';

        const cachedOffices = officesKey
          ? readCache<any>('offices', officesKey)
          : null;

        const [docsRes, placesRes] = await Promise.all([
          documentsApi.getAll(),
          selectedLocation && !cachedOffices
            ? mapApi
                .getOffices(selectedLocation.latitude, selectedLocation.longitude)
                .catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        const mapped: Array<DocumentItem & { collected: boolean }> = (
          docsRes.data.items || []
        ).map((item: any) => mapBackendDocument(item));
        setDocuments(mapped);
        setCheckedDocuments(
          mapped.filter((d: DocumentItem & { collected: boolean }) => d.collected).map((d) => docKey(d))
        );
        const sources = (docsRes.data.sources || []).map(mapBackendDocumentSource);
        setDocumentSources(sources);
        const officesData = cachedOffices ?? placesRes?.data ?? null;

        if (!cachedOffices && officesKey && officesData && !officesData.failed) {
          writeCache('offices', officesKey, officesData);
        }

        const categories = (officesData?.categories || []).map(
          mapBackendPlaceCategory
        );
        setPlaceCategories(categories);
        setPlacesFailed(Boolean(officesData?.failed));
      } catch {
        if (!cancelled) setLoadError('Не удалось загрузить документы с сервера');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setCheckedDocuments, selectedLocation]);

  const documentGroups = documentSources
    .map((source) => ({
      source,
      docs: documents.filter((d) => d.sourceId === source.id),
    }))
    .filter((g) => g.docs.length > 0);

  const navigateTo = (path: string, docTitle: string, type: 'materials' | 'algorithms') => {
    const label = `Назад к «${docTitle}»`;
    if (type === 'materials') {
      setMaterialsBackRoute({ path: '/app/step2', label });
    } else {
      setAlgorithmsBackRoute({ path: '/app/step2', label });
    }
    navigate(path);
  };

  const handleBackClick = () => {
    if (algorithmsBackRoute) {
      navigate(algorithmsBackRoute.path, { state: algorithmsBackRoute.state });
      setAlgorithmsBackRoute(null);
    }
  };

  const handleToggle = async (doc: DocumentItem) => {
    const key = docKey(doc);
    if (isAuthenticated && doc.id != null) {
      try {
        await documentsApi.toggleDocument(doc.id);
      } catch {
        return;
      }
    }
    toggleDocument(key);
  };

  const handlePrevStep = () => navigate('/app/step1');
  const handleNextStep = () => navigate('/app/step3');

  const downloadSourceList = (source: DocumentSource, docs: DocumentItem[]) => {
    downloadTextFile(`документы_${source.id}.txt`, buildSourceDownloadContent(source, docs));
  };

  const downloadAllLists = () => {
    downloadTextFile('документы_все_места.txt', buildAllSourcesDownloadContent(documentGroups));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted font-medium">Загрузка документов…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        {algorithmsBackRoute && (
          <div className="mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-base text-text-secondary hover:text-primary font-medium bg-white border-2 border-border rounded-xl px-4 py-2 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              {algorithmsBackRoute.label}
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary font-bold mb-1">Шаг 2</p>
            <h2 className="text-2xl font-bold font-display text-text-primary mb-2">
              Документы для продажи
            </h2>
            <p className="text-base text-text-secondary">
              Отметьте документы, которые уже собраны. Списки сгруппированы по местам получения.
            </p>
            {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}
          </div>
          {documentGroups.length > 0 && (
            <button
              onClick={downloadAllLists}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-text-secondary font-medium rounded-lg border-2 border-border hover:border-primary/30 hover:bg-slate-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Скачать все списки
            </button>
          )}
        </div>

        {!isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-text-primary">
                Настройте подборку под себя
              </p>
              <p className="text-base text-text-secondary mt-1">
                Зарегистрируйтесь, чтобы видеть только актуальные для вас документы и управлять списком.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {documentGroups.map(({ source, docs }) => (
            <section key={source.id} className="relative">
              <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b-2 border-border">
                <div className="flex-1">
                  <h3 className="text-sm uppercase tracking-wider text-primary font-bold">
                    {source.title}
                  </h3>
                  {source.downloadHeader && (
                    <p className="text-sm text-text-muted mt-1 leading-relaxed">
                      {source.downloadHeader}
                    </p>
                  )}
                  <p className="text-sm text-text-muted mt-0.5">
                    {docs.length}{' '}
                    {docs.length === 1 ? 'документ' : docs.length < 5 ? 'документа' : 'документов'}
                  </p>
                </div>
                <button
                  onClick={() => downloadSourceList(source, docs)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary bg-slate-50 border border-border rounded-lg hover:border-primary/30 transition-colors"
                  title={`Скачать список: ${source.title}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Скачать список
                </button>
              </div>

              <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                {docs.map((doc) => {
                  const key = docKey(doc);
                  const done = checkedDocuments.includes(key);
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        done
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-border bg-white hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      <button onClick={() => void handleToggle(doc)} className="shrink-0 mt-1">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            done ? 'bg-emerald-500 border-emerald-500' : 'border-border-dark'
                          }`}
                        >
                          {done && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-base font-semibold ${
                              done ? 'text-text-muted line-through' : 'text-text-primary'
                            }`}
                          >
                            {doc.title}
                          </span>
                          {doc.required && !done && (
                            <span className="text-xs uppercase tracking-wider text-amber-700 font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg">
                              обязательно
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          {doc.note.map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {doc.algorithmId && (
                            <button
                              onClick={() =>
                                navigateTo(
                                  `/app/step3?algorithm=${doc.algorithmId!}`,
                                  doc.title,
                                  'algorithms'
                                )
                              }
                              className="text-sm text-primary font-semibold hover:text-primary-dark bg-primary/10 border border-primary/30 rounded-lg px-3 py-1"
                            >
                              Алгоритм получения →
                            </button>
                          )}
                          {doc.articleId && (
                            <button
                              onClick={() =>
                                navigateTo(
                                  `/app/materials?article=${doc.articleId!}`,
                                  doc.title,
                                  'materials'
                                )
                              }
                              className="text-sm text-text-secondary font-medium hover:text-primary bg-slate-50 border border-border rounded-lg px-3 py-1"
                            >
                              Узнать подробнее →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-border">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-base text-text-secondary font-medium">
              Собрано: {checkedDocuments.length} / {documents.length || 1}
            </span>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    documents.length
                      ? (checkedDocuments.length / documents.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-base text-emerald-600 font-bold">
              {documents.length
                ? Math.round((checkedDocuments.length / documents.length) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevStep}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-text-secondary font-medium rounded-lg border-2 border-border hover:border-primary/30 hover:bg-slate-50 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Предыдущий шаг
            </button>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg text-sm"
            >
              Следующий шаг
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-72 shrink-0 bg-white border-l-2 border-border p-6 overflow-y-auto">
        {!selectedLocation && (
          <p className="text-sm text-text-muted">
            Выберите объект на Шаге 1 — покажем ближайшие МФЦ
            и офисы Росреестра с расстоянием до них.
          </p>
        )}
        {selectedLocation && placesFailed && (
          <div className="text-sm text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
            Не удалось загрузить список офисов: сервис карт был
            перегружен. Обновите страницу через минуту.
          </div>
        )}
        {selectedLocation && !placesFailed && placeCategories.every(
          (c) => c.places.length === 0
        ) && (
          <p className="text-sm text-text-muted">
            Рядом с выбранным адресом офисы не найдены. Попробуйте
            проверить на Госуслугах.
          </p>
        )}
        <div className="space-y-8">
          {placeCategories
            .filter((category) => category.places.length > 0)
            .map((category) => (
            <div key={category.id}>
              <div className="mb-4">
                <h3 className="text-sm uppercase tracking-wider text-primary font-bold mb-1">
                  {category.title}
                </h3>
                {category.subtitle && (
                  <p className="text-base text-text-secondary">{category.subtitle}</p>
                )}
              </div>
              <div className="space-y-2">
                {category.places.map((place) => {
                  const mapUrl = yandexMapsUrl(place);
                  const cardClass =
                    'block bg-slate-50 border-2 border-border rounded-xl p-3 ' +
                    'transition-colors ' +
                    (mapUrl
                      ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                      : 'hover:border-primary/30');

                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-text-primary">
                          {place.name}
                        </p>
                        <span className="text-sm text-primary font-bold shrink-0">
                          {place.distance}
                        </span>
                      </div>
                      {place.address && (
                        <p className="text-sm text-text-secondary">{place.address}</p>
                      )}
                      {place.time && place.time !== '—' && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-4 h-4 text-text-muted" />
                          <span className="text-sm text-text-secondary">
                            {place.time}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-muted">
                          {mapUrl ? 'открыть на карте' : 'пункт выдачи'}
                        </span>
                      </div>
                    </>
                  );

                  const key = `${category.id}-${place.name}-${place.address}`;

                  return mapUrl ? (
                    <a
                      key={key}
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={key} className={cardClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step2Page;