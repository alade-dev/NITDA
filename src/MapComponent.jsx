/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import SearchBar from './SearchBar';
import './MapComponent.css';

const SidePanel = ({ location, onClose, visible }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      // Add user message
      setChatMessages([...chatMessages, { type: 'user', text: chatInput }]);
      // Simulate AI response - replace with actual AI integration
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: `Here's some information about ${location.name}...`
        }]);
      }, 500);
      setChatInput('');
    }
  };

  if (!visible) return null;

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>Institution Details</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="location-details">
        <h3>{location.name}</h3>
        <div className="details-list">
          <p><strong>Address:</strong> {location.address}</p>
          <p><strong>Category:</strong> {location.category}</p>
          <p><strong>LGA:</strong> {location.lga}</p>
          <p><strong>Ownership:</strong> {location.ownership}</p>
          <p><strong>School Level:</strong> {location.school_level}</p>
        </div>
      </div>

      <div className="chat-section">
        <h3>Chat with AI Assistant</h3>
        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <div key={index} className={`chat-message ${message.type}`}>
              {message.text}
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask our Chatbot about this institution..."
            className="chat-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage} className="send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const MapComponent = () => {
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);

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
    const marker = L.marker([location.latitude, location.longitude]).addTo(mapRef.current);
    
    marker.bindPopup(
      `<b>${location.name}</b><br>
      📍${location.address}<br>
      <button class="view-details-btn">View Details</button>`
    );

    marker.on('popupopen', () => {
      // Find and add click handler to the button after popup is opened
      const button = document.querySelector('.view-details-btn');
      if (button) {
        button.addEventListener('click', () => {
          setSelectedLocation(location);
          setShowSidePanel(true);
        });
      }
    });

    markersRef.current[location.lga] = markersRef.current[location.lga] || [];
    markersRef.current[location.lga].push(marker);
  };

  const handleSearch = (searchTerm) => {
    const lcSearchTerm = searchTerm.toLowerCase();
    const filteredLocations = locations.filter(
      (location) => location.name.toLowerCase().includes(lcSearchTerm)
    );

    Object.values(markersRef.current).flat().forEach((marker) => {
      mapRef.current.removeLayer(marker);
    });

    filteredLocations.forEach((location) => {
      addMarker(location);
    });

    if (filteredLocations.length > 0) {
      const group = L.featureGroup(
        filteredLocations.map((loc) => L.marker([loc.latitude, loc.longitude]))
      );
      mapRef.current.fitBounds(group.getBounds(), { maxZoom: 19 });
    }

    if (mapRef.current.getZoom() > 19) {
      mapRef.current.setZoom(19);
    }
  };

  return (
    <div className="map-container">
      <SearchBar onSearch={handleSearch} />
      <div id="map" className="map"></div>
      {selectedLocation && (
        <SidePanel
          location={selectedLocation}
          onClose={() => setShowSidePanel(false)}
          visible={showSidePanel}
        />
      )}
    </div>
  );
};

export default MapComponent;