let restaurant;
var map;
var mapLoaded = false;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  if (self.restaurant) {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }
};

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});


/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    callback('No restaurant id in URL', null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = 0;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.tabIndex = 0;

  const picture = document.getElementById('restaurant-picture');
  picture.innerHTML = '';

  const sourceSmall = document.createElement('source');
  sourceSmall.media = '(max-width: 400px)';
  sourceSmall.srcset = DBHelper.optImageUrlForRestaurant(restaurant);
  picture.append(sourceSmall);

  const sourceFull = document.createElement('source');
  sourceFull.media = '(max-width: 800px)';
  sourceFull.srcset = DBHelper.optImageUrlForRestaurant(restaurant, '2x');
  picture.append(sourceFull);

  const image = document.createElement('img');
  image.id = 'restaurant-img';
  image.className = 'restaurant-img';
  image.src = DBHelper.optImageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + ' Restaurant Image - ' + restaurant.photoDesc;
  image.tabIndex = 0;
  picture.append(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.tabIndex = 0;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 0;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.tabIndex = 0;
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  title.tabIndex = 0;
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.tabIndex = 0;
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  if (!mapLoaded) {
    loadMap("AIzaSyBrcaMTKZohaMkE_2CkLIHglvfUecjBXDo");
    mapLoaded = true;
  }
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.tabIndex = 0;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.tabIndex = 0;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = 0;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = `<a aria-current="page" href="${DBHelper.urlForRestaurant(restaurant)}">` + restaurant.name + '</a>';
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

const loadMap = (api_key) => {
  'use strict';

  if (api_key) {
    var options = {
      rootMargin: '0px',
      threshold: 1
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