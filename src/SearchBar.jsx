/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Search } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search By Local Government Area"
          className="search-input"
        />
        <button type="submit" className="search-button">
          <Search size={20} />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;