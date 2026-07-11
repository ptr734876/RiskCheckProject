import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Save, ExternalLink, Building2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useNavigationStore } from '@/store/navigationStore';
import { SURVEY_STEPS } from '@/data/constants';

const SurveyPage: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const { setSurveyCompleted, setSurveyFormData } = useAppStore();
  const { setMaterialsBackRoute, setAlgorithmsBackRoute } = useNavigationStore();
  const navigate = useNavigate();

  const currentStep = SURVEY_STEPS[currentStepIndex];
  const totalSteps = SURVEY_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleInputChange = (questionId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
  };

  // Проверяем, должен ли вопрос отображаться
  const shouldShowQuestion = (question: any) => {
    if (!question.condition) return true;
    const { questionId, value } = question.condition;
    return formData[questionId] === value;
  };

  // Получаем видимые вопросы для текущего шага
  const visibleQuestions = currentStep.questions.filter(shouldShowQuestion);

  // Проверяем, есть ли хотя бы один видимый вопрос
  const hasVisibleQuestions = visibleQuestions.length > 0;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что все видимые вопросы заполнены
    const allVisibleAnswered = visibleQuestions.every(
      (question) => formData[question.id] && formData[question.id].trim() !== ''
    );

    if (!allVisibleAnswered) {
      alert('Пожалуйста, ответьте на все отображаемые вопросы');
      return;
    }

    if (isLastStep) {
      setIsCompleted(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  };

  const handleComplete = () => {
    setSurveyFormData(formData);
    setSurveyCompleted(true);
    navigate('/app');
  };

  const handleSkip = () => {
    setSurveyCompleted(true);
    navigate('/app');
  };

  const handleLinkClick = (type: 'algorithm' | 'helpful') => {
    if (type === 'helpful') {
      setMaterialsBackRoute({ path: '/survey', label: 'Вернуться к анкете' });
      navigate('/app/materials');
    } else {
      setAlgorithmsBackRoute({ path: '/survey', label: 'Вернуться к анкете' });
      navigate('/app/step3');
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-white border-b-2 border-border px-6 py-3 flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
          <span className="font-display font-semibold text-lg text-text-primary">Атлас продаж</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-border p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-bold font-display text-text-primary mb-3">Анкета заполнена!</h2>
            <p className="text-base text-text-secondary mb-8">
              Теперь вам доступны персональные рекомендации.
            </p>
            <button onClick={handleComplete} className="btn-primary w-full text-base">
              Перейти к рекомендациям
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-white border-b-2 border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
          <span className="font-display font-semibold text-lg text-text-primary">Атлас продаж</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-base text-text-secondary hover:text-primary font-medium flex items-center gap-1"
        >
          Пропустить анкету <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border-2 border-border p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm uppercase tracking-wider text-primary font-bold">Анкетирование</span>
              <span className="text-base text-text-secondary font-semibold">
                Шаг {currentStep.id} из {totalSteps}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold font-display text-text-primary mb-2">{currentStep.title}</h2>
          <p className="text-base text-text-secondary mb-8">{currentStep.subtitle}</p>

          {!hasVisibleQuestions && (
            <div className="text-center py-8 text-text-secondary">
              <p>Нет доступных вопросов для отображения</p>
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-8">
            {visibleQuestions.map((question) => (
              <div key={question.id}>
                <p className="text-base font-semibold text-text-primary mb-4">{question.label}</p>
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isChecked = formData[question.id] === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={isChecked}
                          onChange={() => handleInputChange(question.id, option.value)}
                          className="sr-only"
                          required
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isChecked ? 'border-primary' : 'border-border-dark'
                          }`}
                        >
                          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <span className="text-base text-text-primary">{option.label}</span>
                      </label>
                    );
                  })}
                </div>

                {(question.tip || question.links) && (
                  <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                    {question.tip && (
                      <p className="text-base text-text-secondary leading-relaxed mb-3">{question.tip}</p>
                    )}
                    {question.links && (
                      <div className="flex flex-wrap gap-2">
                        {question.links.map((link, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleLinkClick(link.type)}
                            className="text-sm text-primary font-semibold hover:text-primary-dark bg-white border-2 border-primary/30 rounded-lg px-3 py-2 inline-flex items-center gap-1"
                          >
                            {link.label} <ExternalLink className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {hasVisibleQuestions && (
              <div className="flex items-center gap-3 pt-6 border-t-2 border-border">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center gap-2 text-base text-text-secondary hover:text-primary font-medium border-2 border-border rounded-lg px-5 py-3"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Назад
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-base ml-auto"
                >
                  {isLastStep ? (
                    <>
                      <Save className="w-5 h-5" /> Завершить
                    </>
                  ) : (
                    <>
                      Далее <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;