interface ListingFilters {
  category?: string;
  city?: string;
  locality?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  verifiedOnly?: boolean;
  deliveryAvailable?: boolean;
  q?: string;
}

interface FilterSidebarProps {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
  categories: string[];
}

export function FilterSidebar({ filters, onChange, categories }: FilterSidebarProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Filters</h3>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Search</label>
        <input
          value={filters.q || ""}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
          placeholder="Camera, sofa, projector..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Category</label>
        <select
          value={filters.category || ""}
          onChange={(event) => onChange({ ...filters, category: event.target.value || undefined })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Min Price</label>
          <input
            type="number"
            value={filters.minPrice || ""}
            onChange={(event) => onChange({ ...filters, minPrice: event.target.value })}
            placeholder="500"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Max Price</label>
          <input
            type="number"
            value={filters.maxPrice || ""}
            onChange={(event) => onChange({ ...filters, maxPrice: event.target.value })}
            placeholder="5000"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">City</label>
          <input
            value={filters.city || ""}
            onChange={(event) => onChange({ ...filters, city: event.target.value })}
            placeholder="Bengaluru"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Locality</label>
          <input
            value={filters.locality || ""}
            onChange={(event) => onChange({ ...filters, locality: event.target.value })}
            placeholder="Indiranagar"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(filters.verifiedOnly)}
            onChange={(event) => onChange({ ...filters, verifiedOnly: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Verified lenders only
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(filters.deliveryAvailable)}
            onChange={(event) => onChange({ ...filters, deliveryAvailable: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          Delivery available
        </label>
      </div>
    </div>
  );
}
