import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './MapView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const resortIcon = new L.DivIcon({
  className: 'custom-marker resort-marker',
  html: '<div class="marker-pin resort"></div>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const hotelIcon = new L.DivIcon({
  className: 'custom-marker hotel-marker',
  html: '<div class="marker-pin hotel"></div>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const selectedIcon = new L.DivIcon({
  className: 'custom-marker selected-marker',
  html: '<div class="marker-pin selected"></div>',
  iconSize: [36, 50],
  iconAnchor: [18, 50],
  popupAnchor: [0, -50],
});

function getIcon(type, isSelected) {
  if (isSelected) return selectedIcon;
  if (type === 'resort') return resortIcon;
  return hotelIcon;
}

const TYPE_LABELS = {
  resort: 'Resort',
  hotel: 'Otel',
  guest_house: 'Pansiyon',
};

function FlyToSelected({ resort }) {
  const map = useMap();
  useEffect(() => {
    if (resort) {
      map.flyTo([resort.lat, resort.lon], 14, { duration: 0.8 });
    }
  }, [resort, map]);
  return null;
}

function ClusterLayer({ resorts, selectedResort, onSelectResort }) {
  const map = useMap();
  const markersRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 100) size = 'large';
        else if (count > 30) size = 'medium';
        return L.divIcon({
          html: `<div class="cluster-icon ${size}">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(44, 44),
        });
      },
    });

    resorts.forEach((resort) => {
      const isSelected = selectedResort && selectedResort.id === resort.id;
      const marker = L.marker([resort.lat, resort.lon], {
        icon: getIcon(resort.type, isSelected),
      });

      const popupContent = `
        <div class="resort-popup">
          <h3>${resort.name || 'İsimsiz Tesis'}</h3>
          <span class="popup-type ${resort.type}">${TYPE_LABELS[resort.type] || resort.type}</span>
          ${resort.city ? `<p class="popup-city">📍 ${resort.city}</p>` : ''}
          ${resort.tags.stars ? `<p class="popup-stars">${'★'.repeat(parseInt(resort.tags.stars))}</p>` : ''}
          ${resort.tags.website ? `<a href="${resort.tags.website}" target="_blank" rel="noopener" class="popup-link">Web Sitesi</a>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectResort(resort));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    markersRef.current = clusterGroup;

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
    };
  }, [map, resorts, selectedResort, onSelectResort]);

  return null;
}

function MapView({ resorts, selectedResort, onSelectResort }) {
  const turkeyCenter = [39.0, 35.0];
  const defaultZoom = 6;

  return (
    <div className="map-container">
      <MapContainer
        center={turkeyCenter}
        zoom={defaultZoom}
        className="leaflet-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelected resort={selectedResort} />
        <ClusterLayer
          resorts={resorts}
          selectedResort={selectedResort}
          onSelectResort={onSelectResort}
        />
      </MapContainer>
    </div>
  );
}

export default MapView;
