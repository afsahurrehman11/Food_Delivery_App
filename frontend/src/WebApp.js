import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/web.css';

const API_BASE_URL = 'http://localhost:8000';

export default function WebApp() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/restaurants/`);
      setRestaurants(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load restaurants. Make sure backend is running at http://localhost:8000');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="web-app">
      <header className="app-header">
        <h1>🍕 Food Delivery App</h1>
      </header>

      <main className="app-main">
        {loading && <p className="loading">Loading restaurants...</p>}
        
        {error && (
          <div className="error-box">
            <p>{error}</p>
            <button onClick={fetchRestaurants}>Retry</button>
          </div>
        )}

        {!loading && !error && restaurants.length === 0 && (
          <p className="no-data">No restaurants available</p>
        )}

        {!loading && !error && restaurants.length > 0 && (
          <div className="restaurants-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="restaurant-card">
                <div className="restaurant-image-placeholder">
                  {restaurant.image_url ? (
                    <img src={restaurant.image_url} alt={restaurant.name} />
                  ) : (
                    <div className="placeholder">No Image</div>
                  )}
                </div>
                <div className="restaurant-info">
                  <h2>{restaurant.name}</h2>
                  <p className="cuisine">{restaurant.cuisine_type}</p>
                  <p className="address">{restaurant.address}</p>
                  <div className="rating">
                    ⭐ {restaurant.rating || 'N/A'} ({restaurant.reviews_count || 0} reviews)
                  </div>
                  <button className="view-menu-btn">View Menu</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
