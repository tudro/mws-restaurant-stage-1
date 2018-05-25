import idb from './utils/idb.js';

let reviews = [];

window.addEventListener('online', () => {
  for (let review of reviews) {
    switch (review.type) {
      case 'save':
        DBHelper.saveReviewToDB(review.review, review.callback);
        break;
      case 'edit':
        DBHelper.editReview(review.reviewId, review.data, review.callback);
        break;
      case 'delete':
        DBHelper.deleteReviewFromDB(review.reviewId, review.restaurantId, review.callback);
        break;
    }
  }
  reviews = [];
});

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  static get IDB() {
    return idb.open('mws', 3, function(upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'name'
          });
        case 1:
          upgradeDb.createObjectStore('reviews', {
            keyPath: 'id'
          });
        case 2:
          upgradeDb.createObjectStore('my-reviews', {
            keyPath: 'restaurant_id'
          });
      }
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    if (window.navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/restaurants`)
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
    } else {
      DBHelper.IDB.then(function(db) {
        if (!db) return;
        const restaurants = db.transaction('restaurants').objectStore('restaurants');
        return restaurants.getAll().then(restaurants => {
          if (restaurants.length > 0) {
            callback(null, restaurants);
          }
        });
      });
    }
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
   * Fetch reviews by a restaurant ID.
   */
  static fetchReviewsById(id, callback) {
    // fetch restaurant reviews
    if (window.navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
        .then(response => {
          return response.json();
        })
        .then(reviews => {
          DBHelper.IDB.then(function(db) {
            if (!db) return;

            const tx = db.transaction('reviews', 'readwrite');
            const store = tx.objectStore('reviews');
            store.clear();
            reviews.forEach(function(reviews) {
              store.put(reviews);
            });
          });
          callback(null, reviews);
        })
        .catch(e => {
          const error = (`Request failed: ${e}`);
          callback(error, null);
        });
    } else {
      DBHelper.IDB.then(function(db) {
        if (!db) return;
        const reviews = db.transaction('reviews').objectStore('reviews');
        return reviews.getAll().then(reviews => {
          reviews = reviews.filter(r => r.restaurant_id == id);
          if (reviews.length > 0) {
            callback(null, reviews);
          }
        });
      });
    }
  }

  /**
   * Fetch reviews by a restaurant ID.
   */
  static fetchMyReviewsByResturantId(restaurantId, callback) {
    // fetch restaurant reviews
    DBHelper.IDB.then(function(db) {
      if (!db) return;
      const reviews = db.transaction('my-reviews').objectStore('my-reviews');
      return reviews.getAll().then(reviews => {
        reviews = reviews.filter(r => r.restaurant_id == restaurantId);
        callback(null, reviews);
      });
    });
  }

  /**
   * Save review
   */
  static saveReview(formJsonData, callback) {
    if (!('name' in formJsonData)) {
      callback('Please fill in the name', null);
      return;
    }
    // save review locally
    formJsonData.restaurant_id = parseInt(formJsonData.restaurant_id);
    formJsonData.rating = parseInt(formJsonData.rating);
    formJsonData.review_id = parseInt(formJsonData.review_id);

    DBHelper.IDB.then(function(db) {
      if (!db) return;

      const tx = db.transaction('my-reviews', 'readwrite');
      const store = tx.objectStore('my-reviews');
      store.put(formJsonData);
    });

    if (formJsonData.review_id > 0) {
      const data = {
        name: formJsonData.name,
        rating: formJsonData.rating,
        comments: formJsonData.comments
      };
      DBHelper.editReview(formJsonData.review_id, data, callback);
    } else {
      DBHelper.saveReviewToDB(formJsonData, callback);
    }
  }

  static editReview(reviewId, data, callback = null) {
    if (window.navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }).then(() => document.getElementById('review-info-label').innerText = 'Saved' );
    } else {
      reviews.push({
        type: 'edit',
        reviewId: reviewId,
        data,
        callback
      });
      if (callback != null) {
        callback('Your are offline. Review will be automatically saved when online.', null);
      }
    }
  }

  static saveReviewToDB(review, callback = null) {
    if (window.navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review)
      }).then(function (response) {
        return response.json();
      }).then(function (response) {
        DBHelper.IDB.then(function (db) {
          if (!db) return;

          const tx = db.transaction('my-reviews', 'readwrite');
          const store = tx.objectStore('my-reviews');
          const reviewId = response.id;
          delete response.id;
          response.review_id = reviewId;
          store.put(response);
        });
        if (callback != null) {
          if (response.id >= 0) {
            callback(null, response.id);
          } else {
            callback('Error in saving', null);
          }
        }
      });
    } else {
      reviews.push({
        type: 'save',
        review,
        callback
      });
      if (callback != null) {
        callback('Your are offline. Review will be automatically saved when online.', null);
      }
    }
  }

  /**
   * Delete review
   */
  static deleteReview(formJsonData, callback) {
    // save review locally
    formJsonData.review_id = parseInt(formJsonData.review_id);
    formJsonData.restaurant_id = parseInt(formJsonData.restaurant_id);

    if (formJsonData.review_id > 0) {
      DBHelper.deleteReviewFromDB(formJsonData.review_id, formJsonData.restaurant_id, callback);
    }
  }

  static deleteReviewFromDB(reviewId, restaurantId, callback) {
    if (window.navigator.onLine) {
      fetch(`${DBHelper.DATABASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE'
      }).then(() => {
        DBHelper.IDB.then(function (db) {
          if (!db) return;

          const tx = db.transaction('my-reviews', 'readwrite');
          const store = tx.objectStore('my-reviews');
          store.delete(restaurantId);
          callback(null, 'Deleted');
        });
      });
    } else {
      reviews.push({
        type: 'delete',
        reviewId,
        restaurantId,
        callback
      });
      if (callback != null) {
        callback('Your are offline. Review will be automatically deleted when online.', null);
      }
    }
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
        DBHelper.processRestaurantByCuisineAndNeighborhood(restaurants, cuisine, neighborhood, callback);
      }
    });
  }

  static processRestaurantByCuisineAndNeighborhood(restaurants, cuisine, neighborhood, callback) {
    let results = restaurants;
    if (cuisine !== 'all') { // filter by cuisine
      results = results.filter(r => r.cuisine_type == cuisine);
    }
    if (neighborhood !== 'all') { // filter by neighborhood
      results = results.filter(r => r.neighborhood == neighborhood);
    }
    callback(null, results);
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
        DBHelper.processNeightborhoods(restaurants, callback);
      }
    });
  }

  static processNeightborhoods(restaurants, callback) {
    // Get all neighborhoods from all restaurants
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    callback(null, uniqueNeighborhoods);
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
        DBHelper.processCuisines(restaurants, callback);
      }
    });
  }

  static processCuisines(restaurants, callback) {
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    callback(null, uniqueCuisines);
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
    if (typeof x !== 'undefined') {
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

  /**
   * Update favorite retaurant to DB
   * @param restaurantId
   * @param isFavorite
   */
  static updateFavorites(restaurantId, isFavorite) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {
      method: 'PUT'
    });
  }
}
