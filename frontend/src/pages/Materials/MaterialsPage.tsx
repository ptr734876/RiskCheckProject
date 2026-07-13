import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lightbulb, ChevronLeft, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigationStore } from '@/store/navigationStore';
import { HELPFUL_ARTICLES } from '@/data/constants';

const MaterialsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('article');
  
  const [selectedArticleId, setSelectedArticleId] = useState(
    articleId && HELPFUL_ARTICLES.some(a => a.id === articleId) 
      ? articleId 
      : HELPFUL_ARTICLES[0]?.id || ''
  );
  
  const { materialsBackRoute, setMaterialsBackRoute } = useNavigationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (articleId && HELPFUL_ARTICLES.some(a => a.id === articleId)) {
      setSelectedArticleId(articleId);
    }
  }, [articleId]);

  const selectedArticle = HELPFUL_ARTICLES.find((a) => a.id === selectedArticleId) || HELPFUL_ARTICLES[0];

const handleBackClick = () => {
  if (materialsBackRoute) {
    navigate(materialsBackRoute.path, { 
      state: materialsBackRoute.state 
    });
    setMaterialsBackRoute(null);
  }
};

  const handlePrevStep = () => {
    navigate('/app/step3');
  };

  if (!selectedArticle) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-muted">Нет доступных материалов</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 bg-white border-r-2 border-border p-4 overflow-y-auto flex flex-col">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-wider text-primary font-bold mb-1">Материалы</p>
          <p className="text-base text-text-secondary font-medium">Полезные статьи</p>
        </div>
        
        <div className="space-y-1 flex-1">
          {HELPFUL_ARTICLES.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticleId(article.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-base transition-all duration-200 ${
                selectedArticleId === article.id
                  ? 'bg-primary/10 text-primary border-2 border-primary/30 shadow-md'
                  : 'text-text-secondary hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lightbulb className="w-5 h-5 shrink-0" />
                <span className="font-medium">{article.title}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={handlePrevStep}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-text-secondary font-medium rounded-lg border-2 border-border hover:border-primary/30 hover:bg-slate-50 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к алгоритму
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {materialsBackRoute && (
          <div className="mb-4">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-base text-text-secondary hover:text-primary font-medium bg-white border-2 border-border rounded-xl px-4 py-2 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              {materialsBackRoute.label}
            </button>
          </div>
        )}

        <div className="max-w-3xl">
          <div className="mb-6">
            <h2 className="text-3xl font-bold font-display text-text-primary mb-1">
              {selectedArticle.title}
            </h2>
            <p className="text-lg text-text-secondary font-medium">
              {selectedArticle.description}
            </p>
          </div>

          {selectedArticle.keyPoints.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">
                Ключевые моменты
              </h3>
              <ul className="space-y-1">
                {selectedArticle.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-base text-text-secondary flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="prose max-w-none">
            {selectedArticle.content.map((paragraph, idx) => (
              <p key={idx} className="text-base text-text-primary font-medium leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsPage;