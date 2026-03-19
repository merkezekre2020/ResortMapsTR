import { useState, useEffect, useMemo, useCallback } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import { fetchTurkeyResorts, getStaticResorts } from './data/turkeyResorts';
import './App.css';

function App() {
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedResort, setSelectedResort] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    city: 'all',
    search: '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchTurkeyResorts({ signal: controller.signal });
        setResorts(data.resorts);
        setLastUpdated(data.lastUpdated);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('Live fetch failed, using static data:', err.message);
        const fallback = getStaticResorts();
        setResorts(fallback.resorts);
        setLastUpdated(fallback.lastUpdated);
        setError('Canlı veri çekilemedi, statik veriler gösteriliyor.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => controller.abort();
  }, []);

  const cities = useMemo(() => {
    const citySet = new Set();
    resorts.forEach((r) => {
      if (r.city) citySet.add(r.city);
    });
    return Array.from(citySet).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [resorts]);

  const filteredResorts = useMemo(() => {
    return resorts.filter((r) => {
      if (filters.type !== 'all' && r.type !== filters.type) return false;
      if (filters.city !== 'all' && r.city !== filters.city) return false;
      if (filters.search) {
        const q = filters.search.toLocaleLowerCase('tr');
        const nameMatch = r.name && r.name.toLocaleLowerCase('tr').includes(q);
        const cityMatch = r.city && r.city.toLocaleLowerCase('tr').includes(q);
        if (!nameMatch && !cityMatch) return false;
      }
      return true;
    });
  }, [resorts, filters]);

  const stats = useMemo(() => {
    const resortCount = resorts.filter((r) => r.type === 'resort').length;
    const hotelCount = resorts.filter((r) => r.type === 'hotel').length;
    return { total: resorts.length, resorts: resortCount, hotels: hotelCount };
  }, [resorts]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedResort(null);
  }, []);

  const handleSelectResort = useCallback((resort) => {
    setSelectedResort(resort);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ type: 'all', city: 'all', search: '' });
    setSelectedResort(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Türkiye Resort Haritası</h1>
          <span className="badge">{stats.total} tesis</span>
        </div>
        <div className="header-stats">
          <span className="stat">Resort: {stats.resorts}</span>
          <span className="stat">Otel: {stats.hotels}</span>
          {lastUpdated && <span className="stat date">Güncelleme: {lastUpdated}</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Paneli kapat' : 'Paneli aç'}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </header>

      {error && <div className="app-error">{error}</div>}

      <div className="app-body">
        <MapView
          resorts={filteredResorts}
          selectedResort={selectedResort}
          onSelectResort={handleSelectResort}
        />
        <Sidebar
          open={sidebarOpen}
          loading={loading}
          resorts={filteredResorts}
          allResorts={resorts}
          cities={cities}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          selectedResort={selectedResort}
          onSelectResort={handleSelectResort}
        />
      </div>
    </div>
  );
}

export default App;
