import DBHelper from './dbhelper.js';
import loadJS from './utils/loadJS.js';
import HTMLUtils from './utils/html-utils.js';
import preloadImages from './utils/lazy-load.js';

let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
var mapLoaded = false;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.fetchRestaurants((error, restaurants) => {
    if (error) {
      console.error(error);
    } else {
      fetchNeighborhoods(restaurants);
      fetchCuisines(restaurants);
      updateRestaurants(restaurants);
    }
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = (restaurants = null) => {
  const callback = (error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  };
  if (restaurants === null) {
    DBHelper.fetchNeighborhoods(callback);
  } else {
    DBHelper.processNeightborhoods(restaurants, callback);
  }
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = (restaurants = null) => {
  const callback = (error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  };
  if (restaurants === null) {
    DBHelper.fetchCuisines(callback);
  } else {
    DBHelper.processCuisines(restaurants, callback);
  }
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  self.markers = [];
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  addMarkersToMap();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = (restaurants = null) => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  const callback = (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
    }
  };

  if (restaurants === null) {
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback);
  } else {
    DBHelper.processRestaurantByCuisineAndNeighborhood(restaurants, cuisine, neighborhood, callback);
  }
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';
  // Remove all map markers
  if ('markers' in self) {
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
  }
  self.restaurants = restaurants;
  fillRestaurantsHTML();
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  if (restaurants.length > 0) {
    restaurants.forEach(restaurant => {
      ul.append(createRestaurantHTML(restaurant));
    });
  } else {
    const text = document.createElement('p');
    text.innerHTML = 'No restaurants match the selected filters!';
    text.tabIndex = 0;
    ul.append(text);
  }
  if (!mapLoaded) {
    loadMap("AIzaSyBrcaMTKZohaMkE_2CkLIHglvfUecjBXDo");
    mapLoaded = true;
    preloadImages();
  }
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const pictureBadgeContainer = document.createElement('div');
  pictureBadgeContainer.className = 'picture-badge-container';

  const picture = document.createElement('picture');
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.classList.add('js-lazy-image');
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = restaurant.name + ' Restaurant Image - ' + restaurant.photoDesc;
  image.tabIndex = 0;
  picture.append(image);

  pictureBadgeContainer.append(picture);

  const badge = document.createElement('span');
  pictureBadgeContainer.append(HTMLUtils.generateBadge(badge, restaurant));

  li.append(pictureBadgeContainer);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.tabIndex = 0;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.tabIndex = 0;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = `View Details about ${restaurant.name}`;
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.tabIndex = 0;
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

const loadMap = (api_key) => {
  'use strict';

  if (api_key) {
    var options = {
      rootMargin: '400px',
      threshold: 0
    };

    var map = document.getElementById('map');

    var observer = new IntersectionObserver(
      function(entries, observer) {
        // Detect intersection https://calendar.perfplanet.com/2017/progressive-image-loading-using-intersection-observer-and-sqip/#comment-102838
        var isIntersecting = typeof entries[0].isIntersecting === 'boolean' ? entries[0].isIntersecting : entries[0].intersectionRatio > 0;
        if (isIntersecting) {
          loadJS('https://maps.googleapis.com/maps/api/js?key=' + api_key +
            '&libraries=places&callback=initMap');
          observer.unobserve(map);
        }
      },
      options
    );

    observer.observe(map);
  }
};
