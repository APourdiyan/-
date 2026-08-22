import React, { useState, useMemo, useEffect } from 'react';
import { Place, Neighborhood, EventItem } from './types';
import { DEZFUL_PLACES, DEZFUL_NEIGHBORHOODS, UPCOMING_EVENTS } from './data/dezfulData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FilterChips } from './components/FilterChips';
import { DezfulMap } from './components/DezfulMap';
import { FeaturedPlacesCarousel } from './components/FeaturedPlacesCarousel';
import { NeighborhoodsGrid } from './components/NeighborhoodsGrid';
import { UpcomingEventsList } from './components/UpcomingEventsList';
import { EventsView } from './components/EventsView';
import { LiveAnnouncementsFeed } from './components/LiveAnnouncementsFeed';
import { CityPulseSection } from './components/CityPulseSection';
import { CommunityBanner } from './components/CommunityBanner';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { PlaceDetailModal } from './components/PlaceDetailModal';
import { SubmitPlaceModal } from './components/SubmitPlaceModal';
import { FavoritesModal } from './components/FavoritesModal';
import { EventDetailModal } from './components/EventDetailModal';
import { SubmitAnnouncementModal } from './components/SubmitAnnouncementModal';
import { PlacesListView } from './components/PlacesListView';
import { FullMapScreen } from './components/FullMapScreen';
import { NeighborhoodsView } from './components/NeighborhoodsView';
import { calculateDistance, toPersianDigits } from './utils/persianUtils';
import { Map, ListFilter, CheckCircle, Navigation, Sparkles, MapPin } from 'lucide-react';

export default function App() {
  // State
  const [places, setPlaces] = useState<Place[]>(() => {
    const saved = localStorage.getItem('dezful_places_custom');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...DEZFUL_PLACES, ...parsed];
      } catch (e) {
        return DEZFUL_PLACES;
      }
    }
    return DEZFUL_PLACES;
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [eventsMode, setEventsMode] = useState<'feed' | 'calendar'>('feed');
  const [allEvents, setAllEvents] = useState<EventItem[]>(() => {
    const custom = localStorage.getItem('dezful_custom_events');
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        return [...parsed, ...UPCOMING_EVENTS];
      } catch (e) {
        return UPCOMING_EVENTS;
      }
    }
    return UPCOMING_EVENTS;
  });

  const handleAddCustomEvent = (newEvent: EventItem) => {
    setAllEvents((prev) => {
      const updated = [newEvent, ...prev];
      const customOnly = updated.filter((e) => e.id.startsWith('khadem-'));
      localStorage.setItem('dezful_custom_events', JSON.stringify(customOnly));
      return updated;
    });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNeighborhoodCategory, setSelectedNeighborhoodCategory] = useState<string | null>(null);
  
  // Selected place for map highlight & bottom snap card
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  // Place opened in full detail modal
  const [modalDetailPlace, setModalDetailPlace] = useState<Place | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitAnnouncementModalOpen, setIsSubmitAnnouncementModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isFullMapMode, setIsFullMapMode] = useState(false);


  // User saved places
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dezful_saved_places');
    return saved ? JSON.parse(saved) : ['dez-jameh-mosque', 'dez-sabzqaba-shrine'];
  });

  // Geolocation
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Save Place
  const handleToggleSave = (placeId: string) => {
    setSavedPlaceIds((prev) => {
      let updated: string[];
      if (prev.includes(placeId)) {
        updated = prev.filter((id) => id !== placeId);
        showToast('از نشان‌شده‌ها حذف گردید.');
      } else {
        updated = [...prev, placeId];
        showToast('مکان به نشان‌شده‌های شما افزوده شد.');
      }
      localStorage.setItem('dezful_saved_places', JSON.stringify(updated));
      return updated;
    });
  };

  // Request user GPS location
  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      // Demo location within Dezful near Sabzqaba
      setUserCoords([32.3855, 48.3990]);
      showToast('موقعیت پیش‌فرض در مرکز شهر دزفول تنظیم شد.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setIsLocating(false);
        showToast('موقعیت مکانی شما با موفقیت دریافت شد.');
      },
      (err) => {
        setIsLocating(false);
        // Fallback to Dezful center
        setUserCoords([32.3840, 48.3995]);
        showToast('موقعیت کنونی شما در نزدیکی میدان امام دزفول تنظیم شد.');
      },
      { timeout: 8000 }
    );
  };

  // Find Nearest Mosque handler
  const handleFindNearest = () => {
    if (!userCoords) {
      handleRequestUserLocation();
      setActiveFilter('nearest');
    } else {
      setActiveFilter('nearest');
      showToast('مساجد بر اساس کمترین فاصله تا شما مرتب شدند.');
    }

    // Scroll smoothly to map/list
    const mapEl = document.getElementById('dezful-map-section');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle new place submitted by community
  const handleNewPlaceAdded = (newPlace: Place) => {
    setPlaces((prev) => {
      const updated = [newPlace, ...prev];
      const customOnly = updated.filter((p) => p.id.startsWith('user-place-'));
      localStorage.setItem('dezful_places_custom', JSON.stringify(customOnly));
      return updated;
    });
    setSelectedPlace(newPlace);
    showToast(`مکان «${newPlace.name}» با موفقیت اضافه شد.`);
  };

  // Filtered & Sorted Places
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchNeigh = p.neighborhood.toLowerCase().includes(q);
        const matchAddr = p.address.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchImam = p.imamName ? p.imamName.toLowerCase().includes(q) : false;
        if (!matchName && !matchNeigh && !matchAddr && !matchDesc && !matchImam) {
          return false;
        }
      }

      // Neighborhood category filter
      if (selectedNeighborhoodCategory && p.neighborhoodCategory !== selectedNeighborhoodCategory) {
        return false;
      }

      // Active chips filter
      switch (activeFilter) {
        case 'open_now':
          return p.isOpenNow;
        case 'historic':
          return p.isHistoric;
        case 'hussainiyas':
          return p.type === 'hussainiya';
        case 'women_section':
          return p.features.womenSection;
        case 'wheelchair':
          return p.features.wheelchairAccessible;
        case 'quran_class':
          return p.features.quranClasses;
        case 'has_shavadan':
          return p.hasShavadan;
        case 'today_events':
          return UPCOMING_EVENTS.some((e) => e.placeId === p.id && (e.status === 'today' || e.status === 'live'));
        default:
          return true;
      }
    }).sort((a, b) => {
      if (activeFilter === 'nearest' && userCoords) {
        const distA = calculateDistance(userCoords[0], userCoords[1], a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistance(userCoords[0], userCoords[1], b.coordinates[0], b.coordinates[1]);
        return distA - distB;
      }
      return 0;
    });
  }, [places, searchQuery, activeFilter, selectedNeighborhoodCategory, userCoords]);

  // Saved Places List objects
  const savedPlacesList = useMemo(() => {
    return places.filter((p) => savedPlaceIds.includes(p.id));
  }, [places, savedPlaceIds]);

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#1F2430] pb-24 md:pb-16 font-['Vazirmatn',sans-serif] selection:bg-[#B4552D]/20 selection:text-[#B4552D] flex flex-col">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1F2430]/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={15} className="text-[#C9A227]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savedCount={savedPlaceIds.length}
        onOpenSaved={() => setIsFavoritesModalOpen(true)}
        onOpenQuickFinder={handleFindNearest}
      />

      {/* VIEW RENDER BASED ON ACTIVE TAB */}
      {activeTab === 'home' && (
        <main className="flex-1">
          {/* 2. SHORT HERO SECTION */}
          <HeroSection
            onFindNearest={handleFindNearest}
            onOpenFullMap={() => {
              setActiveTab('map');
              setIsFullMapMode(true);
            }}
            isLocating={isLocating}
            totalPlacesCount={places.length}
          />

          {/* 3. HORIZONTAL FILTER CHIPS */}
          <FilterChips
            activeFilter={activeFilter}
            onSelectFilter={(id) => {
              setActiveFilter(id);
              if (id === 'nearest' && !userCoords) {
                handleRequestUserLocation();
              }
            }}
            resultCount={filteredPlaces.length}
          />

          {/* 4. LIVE MAP CARD */}
          <section id="dezful-map-section" className="py-4">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]"></span>
                  <h2 className="font-extrabold text-base sm:text-lg text-[#1F2430]">
                    نقشهٔ تعاملی و زنده دزفول
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('map');
                    setIsFullMapMode(true);
                  }}
                  className="text-xs font-bold text-[#0E7C86] hover:text-[#0A6B74] flex items-center gap-1 cursor-pointer"
                >
                  <Map size={14} />
                  <span>بزرگ‌نمایی نقشه</span>
                </button>
              </div>

              <DezfulMap
                places={filteredPlaces}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                onOpenDetails={(p) => setModalDetailPlace(p)}
                userCoords={userCoords}
                onRequestUserLocation={handleRequestUserLocation}
                heightClass="h-[340px] sm:h-[420px]"
              />
            </div>
          </section>

          {/* FILTERED RESULTS BANNER (When active search or filter is applied) */}
          {(searchQuery || activeFilter !== 'all' || selectedNeighborhoodCategory) && (
            <div className="max-w-6xl mx-auto px-4 py-2">
              <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-700">
                  <ListFilter size={15} className="text-[#0E7C86]" />
                  <span>
                    نمایش <strong>{toPersianDigits(filteredPlaces.length)}</strong> مکان مطابق با فیلتر شما
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                    setSelectedNeighborhoodCategory(null);
                  }}
                  className="text-[#B4552D] font-bold hover:underline"
                >
                  حذف همه فیلترها
                </button>
              </div>
            </div>
          )}

          {/* 5. FEATURED PLACES CAROUSEL */}
          <FeaturedPlacesCarousel
            places={places}
            onSelectPlace={(p) => {
              setSelectedPlace(p);
              setModalDetailPlace(p);
            }}
            userCoords={userCoords}
            savedPlaceIds={savedPlaceIds}
            onToggleSave={handleToggleSave}
          />

          {/* 6. CITY PULSE: TONIGHT IN DEZFUL (نبض شهر: امشب در دزفول) */}
          <CityPulseSection
            events={allEvents}
            places={places}
            onViewAllEvents={() => {
              setActiveTab('events');
              setEventsMode('feed');
            }}
            onOpenSubmitAnnouncement={() => setIsSubmitAnnouncementModalOpen(true)}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            onSelectPlaceById={(id) => {
              const p = places.find((x) => x.id === id);
              if (p) {
                setSelectedPlace(p);
                setModalDetailPlace(p);
              }
            }}
          />

          {/* 7. NEIGHBORHOODS GRID */}
          <NeighborhoodsGrid
            neighborhoods={DEZFUL_NEIGHBORHOODS}
            selectedCategory={selectedNeighborhoodCategory}
            onSelectNeighborhood={(cat) => {
              setSelectedNeighborhoodCategory(cat === selectedNeighborhoodCategory ? null : cat);
              // Scroll to map
              document.getElementById('dezful-map-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* ALL PLACES LISTING (GRID) */}
          <section className="py-4">
            <div className="max-w-6xl mx-auto px-4 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B4552D]"></span>
                <h2 className="font-extrabold text-base sm:text-lg text-[#1F2430]">
                  فهرست مساجد و حسینیه‌ها
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {toPersianDigits(filteredPlaces.length)} مکان در دسترس
              </span>
            </div>

            <PlacesListView
              places={filteredPlaces}
              onSelectPlace={(p) => {
                setSelectedPlace(p);
                setModalDetailPlace(p);
              }}
              userCoords={userCoords}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={handleToggleSave}
            />
          </section>

          {/* 7. UPCOMING CEREMONIES & EVENTS */}
          <UpcomingEventsList
            events={UPCOMING_EVENTS}
            onSelectPlaceById={(id) => {
              const p = places.find((x) => x.id === id);
              if (p) {
                setSelectedPlace(p);
                setModalDetailPlace(p);
              }
            }}
            onSelectEvent={setSelectedEvent}
          />

          {/* 8. COMMUNITY PARTICIPATION BANNER */}
          <CommunityBanner
            onOpenSubmit={() => setIsSubmitModalOpen(true)}
            onOpenSubmitAnnouncement={() => setIsSubmitAnnouncementModalOpen(true)}
          />
        </main>
      )}

      {/* MAP TAB VIEW: FULL-SCREEN MAP EXPERIENCE */}
      {activeTab === 'map' && (
        <main className="flex-1 w-full relative">
          <FullMapScreen
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            onOpenDetails={(p) => setModalDetailPlace(p)}
            userCoords={userCoords}
            onRequestUserLocation={handleRequestUserLocation}
            savedPlaceIds={savedPlaceIds}
            onToggleSave={handleToggleSave}
          />
        </main>
      )}

      {/* EVENTS TAB VIEW: LIVE ANNOUNCEMENTS FEED & CEREMONIES CALENDAR */}
      {activeTab === 'events' && (
        <main className="flex-1 w-full">
          {/* Top Sub-Switcher between Live Feed and Monthly Calendar */}
          <div className="bg-[#FAF7F2] border-b border-stone-200 px-4 py-2 flex items-center justify-between max-w-xl mx-auto">
            <span className="text-[11px] font-bold text-stone-500">حالت نمایش:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200/90 shadow-2xs">
              <button
                onClick={() => setEventsMode('feed')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  eventsMode === 'feed'
                    ? 'bg-[#B4552D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>فید زنده اعلانات</span>
              </button>

              <button
                onClick={() => setEventsMode('calendar')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  eventsMode === 'calendar'
                    ? 'bg-[#1F2430] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>تقویم و مراسم‌ها</span>
              </button>
            </div>
          </div>

          {eventsMode === 'feed' ? (
            <LiveAnnouncementsFeed
              events={allEvents}
              places={places}
              onSelectPlaceById={(id) => {
                const p = places.find((x) => x.id === id);
                if (p) {
                  setSelectedPlace(p);
                  setModalDetailPlace(p);
                }
              }}
              onSelectEvent={setSelectedEvent}
              onAddEvent={handleAddCustomEvent}
            />
          ) : (
            <div className="p-3 sm:p-5 max-w-5xl mx-auto w-full">
              <EventsView
                events={allEvents}
                places={places}
                userCoords={userCoords}
                onSelectPlaceById={(id) => {
                  const p = places.find((x) => x.id === id);
                  if (p) {
                    setSelectedPlace(p);
                    setModalDetailPlace(p);
                  }
                }}
                onSelectEvent={setSelectedEvent}
              />
            </div>
          )}
        </main>
      )}

      {/* NEIGHBORHOODS TAB VIEW */}
      {activeTab === 'neighborhoods' && (
        <main className="flex-1 p-3 sm:p-4 max-w-5xl mx-auto w-full">
          <NeighborhoodsView
            places={places}
            userCoords={userCoords}
            savedPlaceIds={savedPlaceIds}
            onToggleSave={handleToggleSave}
            onSelectPlace={(p) => {
              setSelectedPlace(p);
              setModalDetailPlace(p);
            }}
            selectedCategory={selectedNeighborhoodCategory as any}
            onSelectCategory={(cat) => setSelectedNeighborhoodCategory(cat)}
          />
        </main>
      )}

      {/* 9. BOTTOM NAVIGATION BAR */}
      <BottomNavigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'submit') {
            setIsSubmitModalOpen(true);
          } else {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* MODALS */}
      {/* 1. Place Detail Modal / Bottom Sheet */}
      <PlaceDetailModal
        place={modalDetailPlace}
        onClose={() => setModalDetailPlace(null)}
        userCoords={userCoords}
        isSaved={modalDetailPlace ? savedPlaceIds.includes(modalDetailPlace.id) : false}
        onToggleSave={handleToggleSave}
        onSelectPlace={(p) => {
          setSelectedPlace(p);
          setModalDetailPlace(p);
        }}
      />

      {/* 2. Submit Place Modal */}
      {isSubmitModalOpen && (
        <SubmitPlaceModal
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmitSuccess={handleNewPlaceAdded}
        />
      )}

      {/* 3. Favorites Modal */}
      {isFavoritesModalOpen && (
        <FavoritesModal
          savedPlaces={savedPlacesList}
          onClose={() => setIsFavoritesModalOpen(false)}
          onSelectPlace={(p) => {
            setSelectedPlace(p);
            setModalDetailPlace(p);
          }}
          onRemoveSave={handleToggleSave}
        />
      )}

      {/* 4. Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSelectPlaceById={(id) => {
          const p = places.find((x) => x.id === id);
          if (p) {
            setSelectedPlace(p);
            setModalDetailPlace(p);
          }
        }}
      />

      {/* 5. Khadem Fast Submit Announcement Modal */}
      {isSubmitAnnouncementModalOpen && (
        <SubmitAnnouncementModal
          places={places}
          onClose={() => setIsSubmitAnnouncementModalOpen(false)}
          onSubmitSuccess={(newEvent) => {
            handleAddCustomEvent(newEvent);
            showToast('اطلاعیه شما با موفقیت در نبض شهر دزفول منتشر گردید.');
          }}
        />
      )}

    </div>
  );
}
