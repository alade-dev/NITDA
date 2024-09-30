import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import SearchBar from './SearchBar';
import './MapComponent.css';

const MapComponent = () => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: [8.1648098, 4.7523337],
        zoom: 20,
        maxZoom: 19
      });

      L.tileLayer(
        `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`,
        {
          maxZoom: 19,
          attribution: "📍 Basic Schools in Kwara state NITDA",
        }
      ).addTo(mapRef.current);

      fetch("locations.json")
        .then((response) => response.json())
        .then((data) => {
          setLocations(data);
          data.forEach((location) => {
            addMarker(location);
          });
        })
        .catch((error) => console.error("Error loading JSON:", error));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const addMarker = (location) => {
    const {
      latitude,
      longitude,
      name,
      category,
      address,
      ownership,
      school_level,
      lga,
    } = location;

    const marker = L.marker([latitude, longitude]).addTo(mapRef.current);
    marker.bindPopup(
      `<b>${name}</b><br>📍${address}<br>Category: ${category}<br>LGA: ${lga}<br>Ownership: ${ownership}<br>School level: ${school_level}`
    );

    markersRef.current[lga] = markersRef.current[lga] || [];
    markersRef.current[lga].push(marker);
  };

  const handleSearch = (searchTerm) => {
    const lcSearchTerm = searchTerm.toLowerCase();
    const filteredLocations = locations.filter(
      (location) => location.lga.toLowerCase().includes(lcSearchTerm)
    );

    // Clear all markers
    Object.values(markersRef.current).flat().forEach((marker) => {
      mapRef.current.removeLayer(marker);
    });

    // Add filtered markers
    filteredLocations.forEach((location) => {
      addMarker(location);
    });

    // Adjust map view to show all filtered markers
    if (filteredLocations.length > 0) {
      const group = L.featureGroup(
        filteredLocations.map((loc) => L.marker([loc.latitude, loc.longitude]))
      );
      mapRef.current.fitBounds(group.getBounds(), { maxZoom: 19 });
    }

    // Ensure the zoom level doesn't exceed 19
    mapRef.current.setMaxZoom(19);
    if (mapRef.current.getZoom() > 19) {
      mapRef.current.setZoom(19);
    }
  };

  return (
    <div style={{ position: 'relative', height: "100vh", width: "100%", }}>
      <SearchBar onSearch={handleSearch} />
      <div id="map" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
};

export default MapComponent;