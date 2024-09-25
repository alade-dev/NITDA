import { useEffect, useRef } from "react";
import L from "leaflet";

const MapComponent = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: [8.1648098, 4.7523337],
        zoom: 19,
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

      fetch("/locations.json")
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          data.forEach((location) => {
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

            const marker = L.marker([latitude, longitude]).addTo(
              mapRef.current
            );
            marker.bindPopup(
              `<b>${name}</b><br>📍${address}<br>Category: ${category}<br>LGA: ${lga}<br>Ownership: ${ownership}<br>School level: ${school_level}`
            );
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

  return <div id="map" style={{ height: "100vh", width: "100%" }}></div>;
};

export default MapComponent;
