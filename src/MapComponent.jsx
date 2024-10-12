/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import SearchBar from './SearchBar';
import './MapComponent.css';

const SidePanel = ({ institution, onClose, visible }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [liveDetails, setLiveDetails] = useState(null);

  useEffect(() => {
    if (institution) {
      fetchLiveDetails(institution.name);
    }
  }, [institution]);

  const fetchLiveDetails = async (instName) => {
    try {
      const response = await fetch(`https://nitda.onrender.com/live_details?inst_name=${encodeURIComponent(instName)}`);      
      const data = await response.json();
      setLiveDetails(data.ai_response);
    } catch (error) {
      console.error("Error fetching live details:", error);
    }
  };

  const handleSendMessage = async () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { type: 'user', text: chatInput }]);
      try {
        const response = await fetch(`https://nitda.onrender.com/chatbot?query=${encodeURIComponent(chatInput)}&inst_name=${encodeURIComponent(institution.name)}`);
        const data = await response.json();
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: data.ai_response
        }]);
      } catch (error) {
        console.error("Error fetching chatbot response:", error);
        setChatMessages(prev => [...prev, {
          type: 'ai',
          text: "Sorry, I couldn't process your request at the moment."
        }]);
      }
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
        <h3>{institution.name}</h3>
        <div className="details-list">
          <p><strong>Year of Establishment:</strong> {institution.yoe}</p>
          <p><strong>Ownership:</strong> {institution.onwership}</p>
          <p><strong>Category:</strong> {institution.category}</p>
          {liveDetails && (
            <>
              <p><strong>In Session:</strong> {liveDetails.in_session ? 'Yes' : 'No'}</p>
              <p><strong>Admission Ongoing:</strong> {liveDetails.admission_ongoing ? 'Yes' : 'No'}</p>
              <p><strong>Vice Chancellor:</strong> {liveDetails.vice_chancellor}</p>
            </>
          )}
        </div>
        {institution.image_url && (
          <img src={institution.image_url} alt={institution.name} className="institution-image" />
        )}
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
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: [8.4858957, 4.674583], // Centered on University of Ilorin
        zoom: 19,
        maxZoom: 19
      });

      L.tileLayer(
        `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        }`,
        {
          maxZoom: 19,
          attribution: "📍 Tertiary Institutions in Kwara State",
        }
      ).addTo(mapRef.current);

      // Load the new JSON file
      fetch("kwara_inst.json")
        .then((response) => response.json())
        .then((data) => {
          setInstitutions(data);
          data.forEach((institution) => {
            addMarker(institution);
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

  const addMarker = (institution) => {
    const marker = L.marker([institution.lat, institution.lng]).addTo(mapRef.current);
    
    marker.bindPopup(
      `<b>${institution.name}</b><br>
      📍${institution.category}<br>
      <button class="view-details-btn">View Details</button>`
    );

    marker.on('popupopen', () => {
      const button = document.querySelector('.view-details-btn');
      if (button) {
        button.addEventListener('click', () => {
          setSelectedInstitution(institution);
          setShowSidePanel(true);
        });
      }
    });

    markersRef.current[institution.category] = markersRef.current[institution.category] || [];
    markersRef.current[institution.category].push(marker);
  };

  const handleSearch = (searchTerm) => {
    const lcSearchTerm = searchTerm.toLowerCase();
    const filteredInstitutions = institutions.filter(
      (institution) => institution.name.toLowerCase().includes(lcSearchTerm) ||
                       institution.category.toLowerCase().includes(lcSearchTerm)
    );

    Object.values(markersRef.current).flat().forEach((marker) => {
      mapRef.current.removeLayer(marker);
    });

    filteredInstitutions.forEach((institution) => {
      addMarker(institution);
    });

    if (filteredInstitutions.length > 0) {
      const group = L.featureGroup(
        filteredInstitutions.map((inst) => L.marker([inst.lat, inst.lng]))
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
      {selectedInstitution && (
        <SidePanel
          institution={selectedInstitution}
          onClose={() => setShowSidePanel(false)}
          visible={showSidePanel}
        />
      )}
    </div>
  );
};

export default MapComponent;