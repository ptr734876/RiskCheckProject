import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Clock, ChevronLeft, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useNavigationStore } from '@/store/navigationStore';
import { DOCUMENTS, MFC_LOCATIONS_PROPERTY, MFC_LOCATIONS_USER } from '@/data/constants';

const Step2Page: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { checkedDocuments, toggleDocument } = useAppStore();
  const { materialsBackRoute, algorithmsBackRoute, setMaterialsBackRoute, setAlgorithmsBackRoute } = useNavigationStore();
  const navigate = useNavigate();

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
    if (materialsBackRoute) {
      navigate(materialsBackRoute.path);
      setMaterialsBackRoute(null);
    } else if (algorithmsBackRoute) {
      navigate(algorithmsBackRoute.path);
      setAlgorithmsBackRoute(null);
    }
  };

  const backRoute = materialsBackRoute || algorithmsBackRoute;

  const handlePrevStep = () => navigate('/app/step1');
  const handleNextStep = () => navigate('/app/step3');

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        {backRoute && (
          <div className="mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-base text-text-secondary hover:text-primary font-medium bg-white border-2 border-border rounded-xl px-4 py-2 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              {backRoute.label}
            </button>
          </div>
        )}

        <div className="mb-6">
          <p className="text-sm uppercase tracking-wider text-primary font-bold mb-1">Шаг 2</p>
          <h2 className="text-2xl font-bold font-display text-text-primary mb-2">
            Документы для продажи
          </h2>
          <p className="text-base text-text-secondary">
            Отметьте документы, которые уже собраны
          </p>
        </div>

        {!isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-text-primary">
                Персональный список документов
              </p>
              <p className="text-base text-text-secondary mt-1">
                Зарегистрируйтесь для получения персональной подборки.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {DOCUMENTS.map((doc) => {
            const done = checkedDocuments.includes(doc.title);
            return (
              <div
                key={doc.title}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                  done
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-border bg-white hover:border-primary/30 hover:shadow-md'
                }`}
              >
                <button onClick={() => toggleDocument(doc.title)} className="shrink-0 mt-1">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      done ? 'bg-emerald-500 border-emerald-500' : 'border-border-dark'
                    }`}
                  >
                    {done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
                  <p className="text-sm text-text-secondary">{doc.note.map((line, index) => (<p key={index}>{line}</p>))}</p>
                  <div className="flex gap-2 mt-2">
                    {doc.algorithmId && (
                      <button
                        onClick={() => navigateTo('/app/step3', doc.title, 'algorithms')}
                        className="text-sm text-primary font-semibold hover:text-primary-dark bg-primary/10 border border-primary/30 rounded-lg px-3 py-1"
                      >
                        Алгоритм получения →
                      </button>
                    )}
                    {doc.articleId && (
                      <button
                        onClick={() => navigateTo('/app/materials', doc.title, 'materials')}
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

        <div className="mt-6 pt-4 border-t-2 border-border">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-base text-text-secondary font-medium">
              Собрано: {checkedDocuments.length} / {DOCUMENTS.length}
            </span>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(checkedDocuments.length / DOCUMENTS.length) * 100}%` }}
              />
            </div>
            <span className="text-base text-emerald-600 font-bold">
              {Math.round((checkedDocuments.length / DOCUMENTS.length) * 100)}%
            </span>
          </div>

          {/* Навигационные кнопки */}
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
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-wider text-primary font-bold mb-2">МФЦ</h3>
          <p className="text-base text-text-secondary">Ближайшие центры подачи документов</p>
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" /> Ближайшие к объекту
            </p>
            <div className="space-y-2">
              {MFC_LOCATIONS_PROPERTY.map((mfc) => (
                <div
                  key={mfc.name}
                  className="bg-slate-50 border-2 border-border rounded-xl p-3 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-text-primary">{mfc.name}</p>
                    <span className="text-sm text-primary font-bold shrink-0">{mfc.distance}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{mfc.address}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{mfc.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" /> Ближайшие к вам
            </p>
            <div className="space-y-2">
              {MFC_LOCATIONS_USER.map((mfc) => (
                <div
                  key={mfc.name}
                  className="bg-white border-2 border-dashed border-border rounded-xl p-3 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-text-primary">{mfc.name}</p>
                    <span className="text-sm text-primary font-bold shrink-0">{mfc.distance}</span>
                  </div>
                  <p className="text-sm text-text-secondary">{mfc.address}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{mfc.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Page;