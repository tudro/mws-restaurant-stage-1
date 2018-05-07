// import idb from './utils/idb.js';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    //const port = 8000; // Change this to your server port
    //return `http://localhost:${port}/data/restaurants.json`;
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get IDB() {
    return idb.open('mws', 1, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          const keyValStore = upgradeDb.createObjectStore('restaurants', {
            keyPath: 'name'
          }); // name of object store
      }
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.IDB.then(function(db) {
      if (!db) return;
      const restaurants = db.transaction('restaurants').objectStore('restaurants');
      return restaurants.getAll().then(restaurants => {
        if (restaurants.length > 0) {
          callback(null, restaurants);
        }
      });
    });
    // DBHelper.fetchCachedRestaurants(callback);

    fetch(DBHelper.DATABASE_URL)
      .then(response => {
        return response.json();
      })
      .then(restaurants => restaurants.map(restaurant => {
        if ('photograph' in restaurant) {
          restaurant.photograph += '.webp';
        } else {
          restaurant.photograph = 'default.webp';
        }
        return restaurant;
      }))
      .then(restaurants => {
        DBHelper.IDB.then(function(db) {
          if (!db) return;

          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
          restaurants.forEach(function(restaurant) {
            store.put(restaurant);
          });
        });
        callback(null, restaurants);
      })
      .catch(e => {
        const error = (`Request failed: ${e}`);
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine !== 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood !== 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./images/${restaurant.photograph}`);
  }

  /**
   * Restaurant optimized image URL.
   */
  static optImageUrlForRestaurant(restaurant, x) {
    let imageName = restaurant.photograph;
    if (typeof variable !== 'undefined') {
      imageName = restaurant.photograph.substring(0, restaurant.photograph.indexOf('.webp')) + '_' + x + '.webp';
    }

    return (`./images/${imageName}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    return new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
  }

}
