
export type LinkRef = { type: 'helpful' | 'algorithm'; id: string } | null;

export interface HintTemplate {
  impact: string;
  tip: string;
  link?: LinkRef;
}

export interface ValueAwareHint extends HintTemplate {

  byValue?: Record<string, Partial<HintTemplate>>;
}

export const SURROUNDING_HINTS: Record<string, HintTemplate> = {
  metro: {
    impact: 'Транспортная доступность — один из главных факторов цены.',
    tip: 'Укажите время пешком до метро в объявлении: это заметно повышает отклик.',
    link: null,
  },
  school: {
    impact: 'Школа в пешей доступности расширяет круг покупателей с детьми.',
    tip: 'Уточните рейтинг школы и правила приёма по прописке — покупатели спрашивают.',
    link: null,
  },
  kindergarten: {
    impact: 'Детский сад рядом ценится семьями с малышами.',
    tip: 'Проверьте наличие мест и очередь — это частый вопрос на показах.',
    link: null,
  },
  park: {
    impact: 'Зелёная зона рядом улучшает экологию и вид из окна.',
    tip: 'Сделайте фото парка: зелень хорошо работает в объявлении.',
    link: null,
  },
  big_road: {
    impact:
      'Крупная дорога в {distance} — источник шума и выхлопов, для части покупателей это стоп-фактор.',
    tip: 'Оцените шум в разные часы и отразите меры шумоизоляции окон.',
    link: null,
  },
  railway: {
    impact:
      'Железная дорога в {distance} даёт шум и вибрацию, особенно ночью.',
    tip: 'Проверьте фактический уровень шума в разное время суток.',
    link: null,
  },
  industrial_zone: {
    impact:
      'Промышленная зона в {distance} может влиять на воздух и шумовой фон.',
    tip: 'Уточните профиль предприятий и границы санитарно-защитной зоны.',
    link: null,
  },
  cemetery: {
    impact: 'Соседство с кладбищем для части покупателей — стоп-фактор.',
    tip: 'Если объект не виден из окон, укажите это прямо: снимает половину возражений.',
    link: null,
  },
};

export const SURROUNDING_FALLBACK: Record<'plus' | 'minus', HintTemplate> = {
  plus: {
    impact: 'Положительный фактор окружения, повышающий привлекательность объекта.',
    tip: 'Отметьте этот плюс в объявлении и на показах.',
    link: null,
  },
  minus: {
    impact: 'Фактор окружения, который стоит учитывать при оценке и продаже.',
    tip: 'Будьте готовы честно ответить на вопросы покупателя.',
    link: null,
  },
};


export const LEGAL_HINTS: Record<string, ValueAwareHint> = {
  cadastral_number: {
    impact: 'Кадастровый номер — идентификатор объекта в ЕГРН.',
    tip: 'Сверьте номер с выпиской ЕГРН и документами о собственности.',
    link: null,
  },
  boundaries_status: {
    impact: 'Установленные границы снижают риск земельных споров с соседями.',
    tip: 'Если границы не установлены, потребуется межевание.',
    byValue: {
      'не установлен': {
        impact:
          'Границы не установлены — это частая причина споров с соседями и отказов банка в ипотеке.',
        tip: 'Закажите межевание до выхода на сделку: процедура занимает несколько недель.',
      },
      'установлен': {
        impact: 'Границы установлены — участок отмежёван, риск споров ниже.',
        tip: 'Убедитесь, что координаты в выписке совпадают с фактическим забором.',
      },
    },
  },
  area: {
    impact: 'Площадь из ЕГРН — то, что видит покупатель и банк.',
    tip: 'Расхождение с фактической площадью более 5% стоит объяснить заранее.',
    link: null,
  },
  land_category: {
    impact: 'Категория земель определяет, что законно строить и как использовать участок.',
    tip: 'Проверьте, что фактическое использование не противоречит категории.',
    link: null,
  },
  permitted_use: {
    impact: 'ВРИ (вид разрешённого использования) ограничивает назначение объекта.',
    tip: 'Несоответствие ВРИ фактическому использованию — риск для покупателя.',
    link: null,
  },
  ownership_type: {
    impact: 'Форма собственности влияет на состав документов для сделки.',
    byValue: {
      'долев': {
        impact:
          'Долевая собственность: у остальных дольщиков есть преимущественное право покупки.',
        tip: 'Отправьте совладельцам нотариальное уведомление за месяц до сделки.',
      },
      'совместн': {
        impact:
          'Совместная собственность: распоряжение возможно только по согласию всех собственников.',
        tip: 'Получите нотариальное согласие супруга или совладельца до сделки.',
      },
      'общая': {
        impact:
          'Общая собственность: потребуется согласие всех собственников, а часто и нотариус.',
        tip: 'Соберите согласия заранее — это самый частый источник срыва сроков.',
      },
      'индивидуальная': {
        impact: 'Индивидуальная собственность упрощает сделку.',
        tip: 'Проверьте, не приобретался ли объект в браке — тогда нужно согласие супруга.',
      },
    },
    tip: 'Уточните состав собственников по выписке ЕГРН.',
  },
  encumbrances: {
    impact: 'Обременения ограничивают распоряжение объектом.',
    tip: 'Проверьте актуальность сведений: выписка ЕГРН действует ограниченное время.',
    byValue: {
      'не выявлен': {
        impact: 'Обременения не выявлены — это упрощает сделку.',
        tip: 'Всё равно закажите свежую выписку перед сделкой: данные меняются.',
      },
      'ипотек': {
        impact: 'Ипотека — распоряжение объектом требует согласия банка.',
        tip: 'Согласуйте с банком схему погашения и снятия залога до аванса.',
      },
      'арест': {
        impact: 'Арест блокирует регистрацию перехода права. Сделка невозможна.',
        tip: 'Выясните основание ареста у пристава и добейтесь снятия до сделки.',
      },
      'аренд': {
        impact: 'Аренда сохраняется при смене собственника.',
        tip: 'Передайте покупателю договор аренды и предупредите о сроках.',
      },
    },
  },
  status: {
    impact: 'Статус записи в ЕГРН показывает, актуален ли объект.',
    tip: 'Архивный или временный статус требует отдельной проверки.',
    link: null,
  },
  cost: {
    impact: 'Кадастровая стоимость — база для расчёта налога, не рыночная цена.',
    tip: 'При завышенной кадастровой стоимости её можно оспорить.',
    link: null,
  },
};

export const LEGAL_FALLBACK: HintTemplate = {
  impact: 'Сведения из государственного реестра недвижимости.',
  tip: 'Сверьте значение с актуальной выпиской ЕГРН.',
  link: null,
};

export const LEGAL_UNAVAILABLE: HintTemplate = {
  impact: 'Без сведений Росреестра юридическую чистоту оценить нельзя.',
  tip: 'Закажите выписку ЕГРН, чтобы заполнить это поле.',
  link: null,
};

export interface HintContext {
  name?: string;
  distance?: string;
  value?: string;
}

function fill(template: string, ctx: HintContext): string {
  return template
    .replace(/\{name\}/g, ctx.name ?? '')
    .replace(/\{distance\}/g, ctx.distance ?? '')
    .replace(/\{value\}/g, ctx.value ?? '');
}

export function resolveSurroundingHint(
  kind: string | undefined,
  type: 'plus' | 'minus',
  ctx: HintContext,
  override?: Partial<HintTemplate>
): HintTemplate {
  const base =
    (kind && SURROUNDING_HINTS[kind]) || SURROUNDING_FALLBACK[type];

  return {
    impact: override?.impact || fill(base.impact, ctx),
    tip: override?.tip || fill(base.tip, ctx),
    link: override?.link ?? base.link ?? null,
  };
}

export function resolveLegalHint(
  field: string,
  value: string | null | undefined,
  options?: { unavailable?: boolean }
): HintTemplate {
  if (options?.unavailable) return LEGAL_UNAVAILABLE;

  const entry = LEGAL_HINTS[field];
  if (!entry) return LEGAL_FALLBACK;

  const ctx: HintContext = { value: value ?? '' };
  let impact = entry.impact;
  let tip = entry.tip;
  let link = entry.link ?? null;

  if (entry.byValue && value) {
    const needle = value.toLowerCase();
    for (const [marker, patch] of Object.entries(entry.byValue)) {
      if (needle.includes(marker)) {
        impact = patch.impact ?? impact;
        tip = patch.tip ?? tip;
        link = patch.link !== undefined ? patch.link : link;
        break;
      }
    }
  }

  return { impact: fill(impact, ctx), tip: fill(tip, ctx), link };
}
