// Step3Page.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronLeft, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useNavigationStore } from '@/store/navigationStore';
import { ALGORITHMS_CONFIG } from '@/data/constants';
import AlgorithmToggle from '@/components/ui/AlgorithmToggle';

const ALGORITHM_LIST = [
  { id: 'general', label: 'Алгоритм продажи' },
];

const Step3Page: React.FC = () => {
  const [activeAlgorithm, setActiveAlgorithm] = useState('general');
  const { isAuthenticated } = useAuthStore();
  const { checkedAlgorithms, toggleAlgorithmStep } = useAppStore();
  const { algorithmsBackRoute, setAlgorithmsBackRoute, setMaterialsBackRoute } = useNavigationStore();
  const navigate = useNavigate();

  const currentConfig = ALGORITHMS_CONFIG[activeAlgorithm];
  const currentAlgo = currentConfig?.steps || [];
  const currentChecked = checkedAlgorithms[activeAlgorithm] || [];
  
  const algoTitle = currentConfig?.title || 'Алгоритм';
  const algoSubtitle = currentConfig?.subtitle || '';

  const hasToggle = !!currentConfig?.toggle;
  const toggleConfig = currentConfig?.toggle;
  const isLeftMode = activeAlgorithm === toggleConfig?.left?.id;

  const handleToggle = () => {
    if (!toggleConfig) return;
    const targetId = isLeftMode ? toggleConfig.right.id : toggleConfig.left.id;
    setActiveAlgorithm(targetId);
  };

  const handleBackClick = () => {
    if (algorithmsBackRoute) {
      navigate(algorithmsBackRoute.path);
      setAlgorithmsBackRoute(null);
    }
  };

  const handleLinkClick = (link: { type: 'algorithm' | 'helpful' | 'step2'; id: string; label: string }) => {
    if (link.type === 'helpful') {
      setMaterialsBackRoute({
        path: '/app/step3',
        label: `Назад к «${link.label}»`,
      });
      navigate('/app/materials');
    } else if (link.type === 'step2') {
      setAlgorithmsBackRoute({
        path: '/app/step3',
        label: 'Назад к алгоритму продажи',
      });
      navigate('/app/step2');
    } else {
      setAlgorithmsBackRoute({
        path: '/app/step3',
        label: `Назад к «${algoTitle}»`,
      });
      if (ALGORITHMS_CONFIG[link.id]) {
        setActiveAlgorithm(link.id);
      }
    }
  };

  const handlePrevStep = () => navigate('/app/step2');
  const handleNextStep = () => navigate('/app/materials');

  const totalMainSteps = currentAlgo.filter(step => !step.isSubStep).length;
  const completedMainSteps = currentAlgo.filter(step => !step.isSubStep && currentChecked.includes(step.id)).length;

  return (
    <div className="flex h-full">
      {/* Левое меню */}
      <div className="w-64 shrink-0 bg-white border-r-2 border-border p-4 overflow-y-auto flex flex-col">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-wider text-primary font-bold mb-1">Шаг 3</p>
          <p className="text-base text-text-secondary font-medium">Алгоритмы</p>
        </div>

        <div className="space-y-1 flex-1">
          {ALGORITHM_LIST.map((item) => {
            const config = ALGORITHMS_CONFIG[item.id];
            const checkedCount = (checkedAlgorithms[item.id] || []).length;
            const totalCount = (config?.steps || []).filter(step => !step.isSubStep).length;
            return (
              <button
                key={item.id}
                onClick={() => setActiveAlgorithm(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base transition-all duration-200 ${
                  activeAlgorithm === item.id
                    ? 'bg-primary/10 text-primary border-2 border-primary/30 shadow-md'
                    : 'text-text-secondary hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{config?.title || item.label}</span>
                  {checkedCount > 0 && (
                    <span className="text-xs text-violet-600 font-bold">
                      {checkedCount}/{totalCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <button
            onClick={handlePrevStep}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-text-secondary font-medium rounded-lg border-2 border-border hover:border-primary/30 hover:bg-slate-50 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Предыдущий шаг
          </button>
          <button
            onClick={handleNextStep}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg text-sm"
          >
            Следующий шаг
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

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

        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display text-text-primary">{algoTitle}</h2>
              {algoSubtitle && (
                <p className="text-sm text-text-muted mt-0.5">{algoSubtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-base text-text-secondary font-medium">
                Выполнено: {completedMainSteps} / {totalMainSteps}
              </span>
              <div className="w-32 h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedMainSteps / Math.max(totalMainSteps, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {hasToggle && toggleConfig && (
          <div className="mb-6 flex items-center gap-4">
            <AlgorithmToggle
              leftLabel={toggleConfig.left.label}
              rightLabel={toggleConfig.right.label}
              isActive={isLeftMode}
              onToggle={handleToggle}
            />
            <span className="text-sm text-text-muted">
              {isLeftMode 
                ? `Сейчас: ${toggleConfig.left.label}` 
                : `Сейчас: ${toggleConfig.right.label}`}
            </span>
          </div>
        )}

        {!isAuthenticated && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-semibold text-text-primary">
                Персональный список алгоритмов
              </p>
              <p className="text-base text-text-secondary mt-1">
                Зарегистрируйтесь для получения персональной подборки.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {currentAlgo.map((step) => {
            const done = currentChecked.includes(step.id);
            const isTitle = !step.isSubStep && step.text.includes('Этап');
            
            return (
              <div
                key={step.id}
                className={`flex flex-col gap-1 p-4 rounded-xl border-2 transition-all ${
                  isTitle 
                    ? 'border-primary/30 bg-primary/5'
                    : done
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-border bg-white hover:border-primary/30 hover:shadow-md'
                } ${step.isSubStep ? 'ml-8' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {!isTitle && (
                    <button
                      onClick={() => toggleAlgorithmStep(activeAlgorithm, step.id)}
                      className="shrink-0 mt-1"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          done ? 'bg-violet-500 border-violet-500' : 'border-border-dark'
                        }`}
                      >
                        {done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )}
                  {isTitle && <div className="w-5 shrink-0" />}
                  
                  <div className="flex-1">
                    <span
                      className={`${
                        isTitle 
                          ? 'text-lg font-bold text-primary'
                          : `text-base ${done ? 'text-text-muted line-through' : 'text-text-primary'}`
                      } leading-relaxed`}
                    >
                      {step.text}
                    </span>
                    
                    {step.description && (
                      <p className={`text-sm ${isTitle ? 'text-text-secondary' : 'text-text-muted'} mt-1 ${done ? 'opacity-70' : ''}`}>
                        {step.description}
                      </p>
                    )}
                    
                    {step.link && (
                      <button
                        onClick={() => handleLinkClick(step.link!)}
                        className="mt-2 text-sm text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {step.link.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Step3Page;