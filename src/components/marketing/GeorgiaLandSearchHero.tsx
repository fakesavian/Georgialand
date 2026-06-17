import React, { useState, useRef, useEffect } from 'react';
import { Search, Map, ChevronRight, Trees, Mountain, Layout, Sprout, Tractor, Waves, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../lib/ThemeContext';
import Papa from 'papaparse';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  image: string;
  count: number | null;
}

const CATEGORY_CONFIG: Omit<Category, 'count'>[] = [
  {
    id: 'north-ga',
    label: 'North Georgia acreage',
    icon: <Mountain size={20} />,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'vacant',
    label: 'Vacant land',
    icon: <Layout size={20} />,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'farmland',
    label: 'Georgia farmland',
    icon: <Tractor size={20} />,
    image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'pasture',
    label: 'Pasture & ranch land',
    icon: <Sprout size={20} />,
    image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'wooded',
    label: 'Wooded tracts',
    icon: <Trees size={20} />,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'rural',
    label: 'Rural acreage',
    icon: <Map size={20} />,
    image: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: 'infill',
    label: 'Infill lots',
    icon: <Layout size={20} />,
    image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&q=80&w=600&h=400',
  }
];

function computeCategories(csvText: string): Category[] {
  const parseAcres = (val: string | undefined) => {
    if (!val) return 0;
    const match = String(val).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const { data: props } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });

  const counts: Record<string, number> = {
    'north-ga': 0, vacant: 0, farmland: 0, pasture: 0, wooded: 0, rural: 0, infill: 0
  };

  props.forEach(p => {
    const type = (p.Property_Type || '').toLowerCase();
    const county = (p.County || '').toLowerCase();
    const acres = parseAcres(p.Lot_Size_Acres);

    if (['fulton', 'dekalb', 'gwinnett', 'forsyth', 'cherokee', 'cobb', 'marietta'].includes(county)) {
      counts['north-ga']++;
    }
    if (type.includes('vacant') && !type.includes('bank')) counts['vacant']++;
    if (type.includes('farm')) counts['farmland']++;
    if (type.includes('pasture') || type.includes('ranch')) counts['pasture']++;
    if (type.includes('wooded') || type.includes('timber')) counts['wooded']++;
    if (county.includes('rural') && acres > 0.5) counts['rural']++;
    if (acres > 0 && acres < 0.5) counts['infill']++;
  });

  return CATEGORY_CONFIG.map(cat => ({ ...cat, count: counts[cat.id] || null }));
}

export default function GeorgiaLandSearchHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>(CATEGORY_CONFIG.map(c => ({ ...c, count: null })));
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function loadCategoryCounts() {
      try {
        const res = await fetch('/local_dashboard_dataset.csv');
        if (res.ok) {
          const csv = await res.text();
          setCategories(computeCategories(csv));
        }
      } catch (err) {
        console.warn('Failed to load category counts:', err);
        setCategories(CATEGORY_CONFIG.map(c => ({ ...c, count: null })));
      }
    }
    loadCategoryCounts();
  }, []);
  const isDay = theme === 'day';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to dashboard with search parameter
      // TODO: Ensure dashboard handles this parameter appropriately
      navigate(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to dashboard with category filter
    // TODO: Connect this to actual filtering logic in the dashboard
    navigate(`/dashboard?category=${categoryId}`);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`glf-search-hero relative overflow-hidden pt-24 pb-16 transition-colors duration-300 ${isDay ? 'bg-[#f6f8f3]' : 'bg-[#0a1713]'}`}>
      {/* Background Textures */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: isDay ? 'radial-gradient(circle at 2px 2px, rgba(50, 103, 82, 0.16) 1px, transparent 0)' : 'radial-gradient(circle at 2px 2px, #425c50 1px, transparent 0)', backgroundSize: '48px 48px' }}>
      </div>
      <div className={`absolute inset-0 pointer-events-none ${isDay ? 'bg-gradient-to-b from-[#eef3e7] via-[#f6f8f3]/95 to-[#f6f8f3]' : 'bg-gradient-to-b from-[#071510]/80 via-[#0a1713]/95 to-[#0a1713]'}`}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* Header Content */}
        <div className="max-w-3xl mx-auto text-center space-y-8 mb-16">
          <div className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm ${isDay ? 'border-brand-200 bg-white text-brand-700' : 'border-olive-700 bg-olive-900/50 text-olive-400'}`}>
            <Map size={24} strokeWidth={1.5} />
          </div>
          
          <h1 className={`text-5xl md:text-7xl font-display font-medium tracking-tight leading-[1.1] ${isDay ? 'text-olive-950' : 'text-[#f3f4f1]'}`}>
            Georgia land intelligence
          </h1>
          
          <p className={`text-lg md:text-xl leading-relaxed font-light ${isDay ? 'text-olive-700' : 'text-olive-300/90'}`}>
            Search land-bank, surplus, tax-sale, GIS, and off-market leads with value, risk, and data-confidence signals built for field research.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8 relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="text-olive-500 group-focus-within:text-brand-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, county, or land type"
              className={`w-full rounded-full border py-4 pl-14 pr-16 text-lg shadow-lg transition-all focus:outline-none focus:ring-2 ${isDay ? 'border-olive-200 bg-white text-olive-950 placeholder-olive-500 hover:border-brand-300 focus:border-brand-500 focus:ring-brand-500/20' : 'border-olive-800 bg-[#0c1a15] text-olive-100 placeholder-olive-500 hover:border-olive-700 focus:border-brand-500 focus:ring-brand-500/50'}`}
            />
            <button
              type="submit"
              className={`absolute inset-y-2 right-2 flex h-12 w-12 items-center justify-center rounded-full transition-all ${isDay ? 'bg-brand-600 text-white hover:bg-brand-500' : 'bg-olive-800 text-olive-300 hover:bg-brand-600 hover:text-olive-950'}`}
              aria-label="Search"
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>

        {/* Categories Carousel Container */}
        <div className="relative -mx-6 px-6 sm:mx-0 sm:px-0">
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 pb-8 pt-4 snap-x snap-mandatory scrollbar-hide no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`group relative flex-none w-[280px] sm:w-[320px] aspect-[4/3] rounded-2xl overflow-hidden snap-start text-left shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${isDay ? 'border border-white bg-white shadow-olive-900/10 hover:-translate-y-0.5 hover:shadow-xl' : 'border border-surface-border/50 hover:border-olive-600'}`}
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <img 
                    src={category.image} 
                    alt={category.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradients */}
                  <div className={`absolute inset-0 ${isDay ? 'bg-gradient-to-b from-white/0 via-white/5 to-white/92' : 'bg-gradient-to-b from-black/10 via-black/20 to-black/80'}`}></div>
                  <div className={`absolute inset-0 transition-colors duration-500 ${isDay ? 'bg-white/5 group-hover:bg-transparent' : 'bg-[#071510]/20 group-hover:bg-transparent'}`}></div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
                  <div className="space-y-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-all group-hover:scale-110 ${isDay ? 'border-brand-100 bg-white/95 text-brand-700 shadow-sm' : 'border-olive-700 bg-olive-900/80 text-brand-400 group-hover:text-brand-300'}`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold tracking-tight transition-colors ${isDay ? 'text-olive-950 group-hover:text-brand-800' : 'text-white group-hover:text-brand-100'}`}>{category.label}</h3>
                      <p className={`mt-1 text-sm font-medium ${isDay ? 'text-olive-600' : 'text-olive-400'}`}>
                        {category.count !== null ? `${category.count} listings` : 'See full database'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Spacer for right padding on mobile */}
            <div className="flex-none w-2 sm:hidden"></div>
          </div>
          
          {/* Custom Scrollbar Styles to hide default scrollbar */}
          <style dangerouslySetInnerHTML={{__html: `
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}} />
        </div>
      </div>
    </section>
  );
}
