import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  Shield,
  Globe,
  MapPin,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  ChevronLeft,
} from 'lucide-react';
import MapView, {
  projectToMap,
  type MapCenter,
  type MapMarker,
} from '@/components/ui/MapView';
import { mapApi, propertiesApi } from '@/api';
import {
  mapBackendProperty,
  mapBackendSurrounding,
} from '@/api/mappers';
import { useNavigationStore } from '@/store/navigationStore';
import type { Property, SurroundingItem as SurroundingItemData } from '@/types';

interface OverviewPin {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
}

interface LegalItemWithTip {
  label: string;
  value: string;
  tip?: string;
  impact?: string;
  link?: { type: 'helpful' | 'algorithm'; id: string } | null;
}

const Tooltip: React.FC<{
  isVisible: boolean;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}> = ({ isVisible, children, onMouseEnter, onMouseLeave, className = '' }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    }
    setIsAnimating(false);
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute bottom-full left-0 mb-2 w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-xl shadow-lg transition-all duration-300 ease-in-out z-10 ${className} ${
        isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

const LegalItem: React.FC<{
  item: LegalItemWithTip;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onTooltipEnter: () => void;
  onTooltipLeave: () => void;
  onLinkClick: (item: any) => void;
}> = ({ item, isHovered, onHover, onLeave, onTooltipEnter, onTooltipLeave, onLinkClick }) => {
  const hasTip = !!(item.tip || item.impact || item.link);

  return (
    <div className="relative">
      <div className="flex items-baseline gap-1">
        <span className="text-text-muted whitespace-nowrap">{item.label}:</span>
        <span className="text-text-primary font-medium break-words flex-1">{item.value}</span>
        {hasTip && (
          <button
            className="shrink-0 text-text-muted hover:text-primary transition-colors ml-1"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
      <Tooltip isVisible={isHovered} onMouseEnter={onTooltipEnter} onMouseLeave={onTooltipLeave}>
        {item.impact && (
          <p className="text-base text-text-secondary leading-relaxed mb-2 break-words">{item.impact}</p>
        )}
        {item.tip && (
          <p className="text-sm text-text-muted leading-relaxed mb-2 break-words">{item.tip}</p>
        )}
        {item.link && (
          <button
            onClick={() => onLinkClick(item)}
            className="text-sm text-primary font-bold hover:text-primary-dark transition-colors inline-flex items-center gap-1 bg-white border-2 border-primary/30 rounded-lg px-3 py-2"
          >
            Перейти к рекомендациям <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </Tooltip>
    </div>
  );
};

const SurroundingItemCard: React.FC<{
  item: SurroundingItemData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onTooltipEnter: () => void;
  onTooltipLeave: () => void;
  onLinkClick: (item: any) => void;
}> = ({ item, isHovered, onHover, onLeave, onTooltipEnter, onTooltipLeave, onLinkClick }) => {
  const dotColor = item.type === 'plus' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="relative">
      <div className="flex items-start gap-3 group">
        <span className={`inline-block w-2 h-2 rounded-full ${dotColor} mt-2 shrink-0`} />
        <span className="text-base text-text-primary leading-relaxed flex-1 break-words">{item.text}</span>
        <button
          className="shrink-0 text-text-muted hover:text-primary transition-colors"
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
      <Tooltip
        isVisible={isHovered}
        onMouseEnter={onTooltipEnter}
        onMouseLeave={onTooltipLeave}
        className="ml-5"
      >
        <p className="text-base text-text-secondary leading-relaxed mb-2 break-words">{item.impact}</p>
        <p className="text-sm text-text-muted leading-relaxed mb-2 break-words">{item.tip}</p>
        {item.link && (
          <button
            onClick={() => onLinkClick(item)}
            className="text-sm text-primary font-bold hover:text-primary-dark transition-colors inline-flex items-center gap-1 bg-white border-2 border-primary/30 rounded-lg px-3 py-2"
          >
            Перейти к рекомендациям <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </Tooltip>
    </div>
  );
};

const Step1Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [overviewPins, setOverviewPins] = useState<OverviewPin[]>([]);
  const [clickedPoint, setClickedPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSurrIndex, setHoveredSurrIndex] = useState<number | null>(null);
  const [hoveredLegalIndex, setHoveredLegalIndex] = useState<{
    type: 'public' | 'private';
    index: number;
  } | null>(null);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [searchedEmpty, setSearchedEmpty] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const legalTimeoutRef = useRef<number | null>(null);
  const {
    setMaterialsBackRoute,
    setAlgorithmsBackRoute,
    step1BackRoute,
    setStep1BackRoute,
  } = useNavigationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const showOverview = (pins: OverviewPin[], center: MapCenter) => {
    setMapCenter(center);
    setMapMarkers(
      pins.map((p) => ({
        type: 'property',
        label: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        propertyId: p.id,
      }))
    );
  };

  const selectPropertyById = async (propertyId: number, addressHint?: string) => {
    setLoading(true);
    setLoadError(null);
    setSearchedEmpty(false);
    try {
      const [detail, ctx] = await Promise.all([
        propertiesApi.getById(propertyId),
        mapApi.getPropertyContext(propertyId).catch(() => null),
      ]);
      const surroundings = (ctx?.data?.surroundings || []).map(mapBackendSurrounding);
      const property = mapBackendProperty(detail.data.property, { surroundings });
      const center: MapCenter = ctx?.data?.center || {
        latitude: property.latitude ?? 0,
        longitude: property.longitude ?? 0,
      };
      const markers: MapMarker[] = ctx?.data?.markers || [
        {
          type: 'property',
          label: property.address,
          latitude: property.latitude,
          longitude: property.longitude,
          propertyId: property.id,
        },
      ];
      setSelectedProperty(property);
      setSearchQuery(addressHint || property.address);
      setMapCenter(center);
      setMapMarkers(markers);
      if (center.latitude && center.longitude) {
        const pin = projectToMap(center.latitude, center.longitude, center);
        setClickedPoint(pin);
      }
    } catch {
      setLoadError('Не удалось загрузить объект');
      setSelectedProperty(null);
      setSearchedEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await propertiesApi.getAll();
        const items = (data.items || []).filter(
          (p: { latitude?: number; longitude?: number }) =>
            p.latitude != null && p.longitude != null
        );
        if (cancelled || items.length === 0) return;

        const center: MapCenter = {
          latitude:
            items.reduce((s: number, p: { latitude: number }) => s + p.latitude, 0) /
            items.length,
          longitude:
            items.reduce((s: number, p: { longitude: number }) => s + p.longitude, 0) /
            items.length,
        };
        const pins: OverviewPin[] = items.map(
          (p: { id: number; address: string; latitude: number; longitude: number }) => {
            const pt = projectToMap(p.latitude, p.longitude, center);
            return {
              id: p.id,
              address: p.address,
              latitude: p.latitude,
              longitude: p.longitude,
              x: pt.x,
              y: pt.y,
            };
          }
        );
        if (cancelled) return;
        setOverviewPins(pins);
        if (!selectedProperty) showOverview(pins, center);
      } catch {
        if (!cancelled) setLoadError('Не удалось загрузить объекты с сервера');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state) {
      const {
        selectedProperty: savedProperty,
        searchQuery: savedQuery,
        mapCenter: savedCenter,
        mapMarkers: savedMarkers,
        clickedPoint: savedPoint,
      } = location.state as {
        selectedProperty?: Property;
        searchQuery?: string;
        mapCenter?: MapCenter;
        mapMarkers?: MapMarker[];
        clickedPoint?: { x: number; y: number };
      };
      if (savedProperty) {
        setSelectedProperty(savedProperty);
        setSearchQuery(savedQuery || savedProperty.address);
        if (savedCenter) setMapCenter(savedCenter);
        else if (savedProperty.latitude != null && savedProperty.longitude != null) {
          setMapCenter({
            latitude: savedProperty.latitude,
            longitude: savedProperty.longitude,
          });
        }
        if (savedMarkers) setMapMarkers(savedMarkers);
        if (savedPoint) setClickedPoint(savedPoint);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (legalTimeoutRef.current) clearTimeout(legalTimeoutRef.current);
    };
  }, []);

  const applyLookup = async (query: string) => {
    setLoading(true);
    setLoadError(null);
    setSearchedEmpty(false);
    try {
      const { data } = await mapApi.lookup(query);
      const mapItems = data.map?.items || [];
      const propRaw = data.property;
      const propertyId = propRaw?.id ?? propRaw?.property_id ?? mapItems[0]?.property_id;

      if (propertyId == null) {
        setSelectedProperty(null);
        setSearchedEmpty(true);
        if (overviewPins.length && mapCenter) showOverview(overviewPins, mapCenter);
        return;
      }
      await selectPropertyById(propertyId, propRaw?.address || query);
    } catch {
      setLoadError('Не удалось выполнить поиск');
      setSelectedProperty(null);
      setSearchedEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSelectedProperty(null);
      setClickedPoint(null);
      setSearchedEmpty(false);
      if (overviewPins.length) {
        const center = mapCenter || {
          latitude: overviewPins[0].latitude,
          longitude: overviewPins[0].longitude,
        };
        showOverview(overviewPins, center);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) void applyLookup(q);
  };

  const handleMapClick = (x: number, y: number) => {
    setClickedPoint({ x, y });
    const found = overviewPins.find((p) => Math.abs(p.x - x) < 50 && Math.abs(p.y - y) < 50);
    if (found) {
      void selectPropertyById(found.id, found.address);
    } else {
      setSelectedProperty(null);
      setSearchedEmpty(true);
      setSearchQuery('');
      if (overviewPins.length && mapCenter) {
        showOverview(overviewPins, {
          latitude:
            overviewPins.reduce((s, p) => s + p.latitude, 0) / overviewPins.length,
          longitude:
            overviewPins.reduce((s, p) => s + p.longitude, 0) / overviewPins.length,
        });
      }
    }
  };

  const handleBackClick = () => {
    if (step1BackRoute) {
      navigate(step1BackRoute.path, { state: step1BackRoute.state });
      setStep1BackRoute(null);
    }
  };

  const handleLinkClick = (item: any) => {
    if (!item.link) return;
    const isHelpful = item.link.type === 'helpful';
    const route = isHelpful
      ? `/app/materials?article=${encodeURIComponent(item.link.id)}`
      : `/app/step3?algorithm=${encodeURIComponent(item.link.id)}`;
    const setBackRoute = isHelpful ? setMaterialsBackRoute : setAlgorithmsBackRoute;
    setBackRoute({
      path: '/app/step1',
      label: `Назад к «${item.text || item.label}»`,
      state: {
        selectedProperty,
        searchQuery,
        mapCenter,
        mapMarkers,
        clickedPoint,
      },
    });
    navigate(route);
  };

  const createTooltipHandlers = (
    setHovered: (value: any) => void,
    ref: React.MutableRefObject<number | null>
  ) => ({
    onHover: (value: any) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
      setIsTooltipHovered(false);
      setHovered(value);
    },
    onLeave: () => {
      if (!isTooltipHovered) {
        ref.current = window.setTimeout(() => setHovered(null), 300);
      }
    },
    onTooltipEnter: () => {
      setIsTooltipHovered(true);
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    },
    onTooltipLeave: () => {
      setIsTooltipHovered(false);
      ref.current = window.setTimeout(() => setHovered(null), 300);
    },
  });

  const surrHandlers = createTooltipHandlers(setHoveredSurrIndex, timeoutRef);
  const legalHandlers = createTooltipHandlers(
    (value: any) => setHoveredLegalIndex(value),
    legalTimeoutRef
  );

  const sortedSurroundings = selectedProperty?.surroundings
    ? [...selectedProperty.surroundings].sort((a, b) => {
        if (a.type === 'plus' && b.type === 'minus') return -1;
        if (a.type === 'minus' && b.type === 'plus') return 1;
        return 0;
      })
    : [];

  const dataSourceLabel =
    selectedProperty?.source === 'demo'
      ? 'Демо-данные (подключение Росреестра)'
      : 'Открытые данные (Росреестр)';

  return (
    <div className="flex flex-col h-full">
      {step1BackRoute && (
        <div className="bg-white border-b-2 border-border p-3 shrink-0">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-base text-text-secondary hover:text-primary font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            {step1BackRoute.label}
          </button>
        </div>
      )}

      <div className="bg-white border-b-2 border-border p-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-sm uppercase tracking-wider text-primary font-bold mb-1">Шаг 1</p>
            <h2 className="text-xl font-bold font-display text-text-primary">
              Выберите недвижимость для оценки и анализа
            </h2>
          </div>
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Введите адрес..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white border-2 border-border rounded-xl pl-12 pr-12 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
        {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}
        {loading && <p className="text-sm text-text-muted mt-2">Поиск…</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto mb-4">
          <div
            className="rounded-xl border-2 border-border shadow-md overflow-hidden"
            style={{ aspectRatio: '480/260' }}
          >
            <MapView
              center={mapCenter}
              markers={mapMarkers}
              selected={!!selectedProperty}
              clickedPoint={clickedPoint}
              onMapClick={handleMapClick}
            />
          </div>
          <p className="text-sm text-text-muted mt-2 text-right">
            Кликните по карте или найдите адрес
          </p>
        </div>

        {selectedProperty && (
          <>
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border-2 border-border shadow-md p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-sm uppercase tracking-wider text-primary font-bold">
                    Юридические данные
                  </h3>
                  <span className="text-sm text-text-muted ml-auto truncate">
                    {selectedProperty.address}
                  </span>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      title: dataSourceLabel,
                      icon: Globe,
                      data: selectedProperty.legal.public,
                      type: 'public' as const,
                    },
                  ].map((section, idx) => (
                    <div key={idx} className={idx > 0 ? 'pt-3 border-t-2 border-border' : ''}>
                      <p className="text-sm font-semibold text-text-secondary flex items-center gap-2 mb-2">
                        <section.icon className="w-4 h-4 shrink-0" /> {section.title}
                      </p>
                      <div className="space-y-1">
                        {(section.data as LegalItemWithTip[]).map((item, index) => {
                          const isHovered =
                            hoveredLegalIndex?.type === section.type &&
                            hoveredLegalIndex?.index === index;
                          return (
                            <LegalItem
                              key={index}
                              item={item}
                              isHovered={isHovered}
                              onHover={() =>
                                legalHandlers.onHover({ type: section.type, index })
                              }
                              onLeave={legalHandlers.onLeave}
                              onTooltipEnter={legalHandlers.onTooltipEnter}
                              onTooltipLeave={legalHandlers.onTooltipLeave}
                              onLinkClick={handleLinkClick}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border-2 border-border shadow-md p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="text-sm uppercase tracking-wider text-primary font-bold">
                    Факты об окружении
                  </h3>
                  <span className="text-sm text-text-muted ml-auto truncate">
                    {selectedProperty.type} • {selectedProperty.area}
                  </span>
                </div>
                <div className="space-y-3">
                  {sortedSurroundings.map((item, index) => (
                    <SurroundingItemCard
                      key={index}
                      item={item}
                      isHovered={hoveredSurrIndex === index}
                      onHover={() => surrHandlers.onHover(index)}
                      onLeave={surrHandlers.onLeave}
                      onTooltipEnter={surrHandlers.onTooltipEnter}
                      onTooltipLeave={surrHandlers.onTooltipLeave}
                      onLinkClick={handleLinkClick}
                    />
                  ))}
                  {sortedSurroundings.length === 0 && (
                    <p className="text-sm text-text-muted">Нет данных об окружении</p>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto mt-6 flex justify-end">
              <button
                onClick={() => navigate('/app/step2')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg text-sm"
              >
                Перейти к следующему шагу
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {searchedEmpty && !selectedProperty && clickedPoint && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="bg-white rounded-xl border-2 border-dashed border-border p-8 text-center">
              <MapPin className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-base text-text-secondary">
                Объект не найден. Попробуйте другой адрес или точку на карте.
              </p>
            </div>
          </div>
        )}

        {searchedEmpty && !selectedProperty && !clickedPoint && (
          <div className="max-w-2xl mx-auto mt-4">
            <div className="bg-white rounded-xl border-2 border-dashed border-border p-8 text-center">
              <MapPin className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-base text-text-secondary">
                Объект не найден. Попробуйте другой адрес.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1Page;
