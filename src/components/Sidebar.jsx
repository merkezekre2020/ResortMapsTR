import { useMemo } from 'react';

const TYPE_LABELS = {
  resort: 'Resort',
  hotel: 'Otel',
  guest_house: 'Pansiyon',
};

const TYPE_ICONS = {
  resort: '🏖️',
  hotel: '🏨',
  guest_house: '🏡',
};

function Sidebar({
  open,
  loading,
  resorts,
  allResorts,
  cities,
  filters,
  onFilterChange,
  onClearFilters,
  selectedResort,
  onSelectResort,
}) {
  const hasActiveFilters = filters.type !== 'all' || filters.city !== 'all' || filters.search;

  const resortCounts = useMemo(() => {
    const counts = { all: allResorts.length, resort: 0, hotel: 0, guest_house: 0 };
    allResorts.forEach((r) => {
      if (counts[r.type] !== undefined) counts[r.type]++;
    });
    return counts;
  }, [allResorts]);

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-content">
        <div className="filter-section">
          <h3>Arama</h3>
          <input
            type="text"
            placeholder="Tesis veya şehir ara..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <h3>Tür</h3>
          <div className="filter-chips">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'resort', label: 'Resort' },
              { key: 'hotel', label: 'Otel' },
            ].map((t) => (
              <button
                key={t.key}
                className={`chip ${filters.type === t.key ? 'active' : ''}`}
                onClick={() => onFilterChange('type', t.key)}
              >
                {t.label}
                <span className="chip-count">{resortCounts[t.key] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3>Şehir</h3>
          <select
            value={filters.city}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="city-select"
          >
            <option value="all">Tüm Şehirler ({cities.length})</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className="clear-filters" onClick={onClearFilters}>
            Filtreleri Temizle
          </button>
        )}

        <div className="results-section">
          <div className="results-header">
            <h3>Sonuçlar</h3>
            <span className="results-count">{resorts.length} tesis</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Veriler yükleniyor...</p>
            </div>
          ) : resorts.length === 0 ? (
            <div className="empty-state">
              <p>Arama kriterlerine uygun tesis bulunamadı.</p>
            </div>
          ) : (
            <ul className="resort-list">
              {resorts.slice(0, 200).map((resort) => (
                <li
                  key={resort.id}
                  className={`resort-item ${selectedResort?.id === resort.id ? 'selected' : ''}`}
                  onClick={() => onSelectResort(resort)}
                >
                  <div className="resort-icon">
                    {TYPE_ICONS[resort.type] || '📍'}
                  </div>
                  <div className="resort-info">
                    <span className="resort-name">{resort.name || 'İsimsiz Tesis'}</span>
                    <div className="resort-meta">
                      <span className={`resort-type ${resort.type}`}>
                        {TYPE_LABELS[resort.type] || resort.type}
                      </span>
                      {resort.city && <span className="resort-city">{resort.city}</span>}
                    </div>
                  </div>
                  {resort.tags.stars && (
                    <span className="resort-stars">{'★'.repeat(parseInt(resort.tags.stars))}</span>
                  )}
                </li>
              ))}
              {resorts.length > 200 && (
                <li className="more-results">
                  +{resorts.length - 200} tesis daha. Filtreleyerek daraltın.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
