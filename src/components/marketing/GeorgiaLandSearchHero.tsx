import React, { useState, useRef } from 'react';
import { Search, Map, ChevronRight, Trees, Mountain, Layout, Sprout, Tractor, Waves, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  {
    id: 'north-ga',
    label: 'North Georgia acreage',
    icon: <Mountain size={20} />,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600&h=400',
    count: '24'
  },
  {
    id: 'vacant',
    label: 'Vacant land',
    icon: <Layout size={20} />,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600&h=400',
    count: '86'
  },
  {
    id: 'farmland',
    label: 'Georgia farmland',
    icon: <Tractor size={20} />,
    image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&q=80&w=600&h=400',
    count: '15'
  },
  {
    id: 'pasture',
    label: 'Pasture & ranch land',
    icon: <Sprout size={20} />,
    image: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&q=80&w=600&h=400',
    count: '31'
  },
  {
    id: 'wooded',
    label: 'Wooded tracts',
    icon: <Trees size={20} />,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600&h=400',
    count: '42'
  },
  {
    id: 'rural',
    label: 'Rural acreage',
    icon: <Map size={20} />,
    image: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?auto=format&fit=crop&q=80&w=600&h=400',
    count: '55'
  },
  {
    id: 'infill',
    label: 'Infill lots',
    icon: <Layout size={20} />,
    image: 'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&q=80&w=600&h=400',
    count: '112'
  }
];

export default function GeorgiaLandSearchHero() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

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
    <section className="relative pt-24 pb-16 overflow-hidden bg-[#0a1713]">
      {/* Background Textures */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #425c50 1px, transparent 0)', backgroundSize: '48px 48px' }}>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#071510]/80 via-[#0a1713]/95 to-[#0a1713] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* Header Content */}
        <div className="max-w-3xl mx-auto text-center space-y-8 mb-16">
          <div className="mx-auto w-12 h-12 rounded-full border border-olive-700 bg-olive-900/50 flex items-center justify-center text-olive-400 mb-6 shadow-sm backdrop-blur-sm">
            <Map size={24} strokeWidth={1.5} />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight text-[#f3f4f1] leading-[1.1]">
            Find Georgia land
          </h1>
          
          <p className="text-lg md:text-xl text-olive-300/90 leading-relaxed font-light">
            Discover low-cost land opportunities, scenic acreage, wooded tracts, vacant lots, and redevelopment leads across Georgia.
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
              className="w-full bg-[#0c1a15] border border-olive-800 text-olive-100 placeholder-olive-500 rounded-full py-4 pl-14 pr-16 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-lg hover:border-olive-700 text-lg"
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 w-12 h-12 bg-olive-800 hover:bg-brand-600 hover:text-olive-950 text-olive-300 rounded-full flex items-center justify-center transition-all"
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
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group relative flex-none w-[280px] sm:w-[320px] aspect-[4/3] rounded-2xl overflow-hidden snap-start text-left focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-lg border border-surface-border/50 hover:border-olive-600 transition-colors"
              >
                {/* Image */}
                <div className="absolute inset-0">
                  <img 
                    src={category.image} 
                    alt={category.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80"></div>
                  <div className="absolute inset-0 bg-[#071510]/20 group-hover:bg-transparent transition-colors duration-500"></div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-full bg-olive-900/80 backdrop-blur border border-olive-700 flex items-center justify-center text-brand-400 group-hover:text-brand-300 group-hover:scale-110 transition-all">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-lg tracking-tight group-hover:text-brand-100 transition-colors">{category.label}</h3>
                      <p className="text-olive-400 text-sm font-medium mt-1">{category.count} listings</p>
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
