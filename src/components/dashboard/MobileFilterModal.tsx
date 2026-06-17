import FilterPanel from './FilterPanel';
import { Filters, LandProperty } from '../../types';

interface MobileFilterModalProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  properties: LandProperty[];
  resultCount: number;
  onClose: () => void;
}

export default function MobileFilterModal({ filters, onChange, properties, resultCount, onClose }: MobileFilterModalProps) {
  return (
    <div className="mobile-filter-modal" role="dialog" aria-modal="true" aria-label="Filter land leads">
      <button type="button" className="mobile-filter-modal__backdrop" onClick={onClose} aria-label="Close filters" />
      <div className="mobile-filter-modal__sheet">
        <FilterPanel
          filters={filters}
          onChange={onChange}
          properties={properties}
          variant="sheet"
          resultCount={resultCount}
          onClose={onClose}
        />
        <div className="mobile-filter-modal__apply">
          <button type="button" onClick={onClose} className="btn-primary h-12 w-full text-sm">
            Show {resultCount} land leads
          </button>
        </div>
      </div>
    </div>
  );
}
