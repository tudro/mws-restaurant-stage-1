import DBHelper from './dbhelper.js';
import loadJS from './utils/loadJS.js';
import HTMLUtils from './utils/html-utils.js';
import moment from './utils/moment.min.js';
import serialize from './utils/form-serialize.js';

let restaurant;
var map;
var mapLoaded = false;
const timestampFormat = 'YYYY-MM-DD';

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
      callback(null, restaurant);
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

  const pictureBadgeContainer = document.getElementsByClassName('picture-badge-container').item(0);

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

  pictureBadgeContainer.append(picture);

  const badge = document.getElementsByClassName('badge').item(0);
  pictureBadgeContainer.append(HTMLUtils.generateBadge(badge, restaurant));

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  cuisine.tabIndex = 0;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviewsById(restaurant.id, (error, reviews) => {
    if (!reviews) {
      console.error(error);
      return;
    }

    const sum = reviews.reduce(function(acc, val) {
      acc.rating = parseInt(acc.rating) + parseInt(val.rating);
      return acc;
    });

    const ratingAverage = document.getElementById('restaurant-rating');
    ratingAverage.innerHTML = '';
    const ratingValue = Math.round(sum.rating / reviews.length);
    ratingAverage.appendChild(HTMLUtils.generateRatingStars(ratingValue));
    ratingAverage.setAttribute('aria-label', `Average rating is ${ratingValue} out of 5`);
    ratingAverage.tabIndex = 0;

    fillReviewsHTML(reviews);
  });
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.innerHTML = '';
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.tabIndex = 0;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key].replace(',', '<br />');
    time.tabIndex = 0;
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  DBHelper.fetchMyReviewsByResturantId(getParameterByName('id'), (error, myReviews) => {
    const container = document.getElementById('reviews-container');
    container.innerHTML = '';
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
    const ul = document.createElement('ul');
    ul.setAttribute('id', 'reviews-list');

    let myReview = {};
    if (myReviews.length > 0) {
      myReview = myReviews[0];
    }

    reviews = reviews.filter(r => r.id !== myReview.review_id);

    ul.appendChild(createMyReviewHTML(myReview));
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });

  if (!mapLoaded) {
    loadMap("AIzaSyBrcaMTKZohaMkE_2CkLIHglvfUecjBXDo");
    mapLoaded = true;
  }
};

/**
 * Create review HTML form
 */
const createMyReviewHTML = (myReview) => {
  const li = document.createElement('li');

  const formDiv = document.createElement('div');
  formDiv.className = 'mws-form';

  const reviewForm = document.createElement('form');
  reviewForm.setAttribute('action', '#');
  reviewForm.setAttribute('id', 'review-form');

  const legend = document.createElement('legend');
  legend.innerText = 'Your review';
  reviewForm.appendChild(legend);

  const restaurantIdInput = document.createElement('input');
  restaurantIdInput.setAttribute('type', 'hidden');
  restaurantIdInput.setAttribute('name', 'restaurant_id');
  restaurantIdInput.value = getParameterByName('id');
  reviewForm.appendChild(restaurantIdInput);

  const reviewIdInput = document.createElement('input');
  reviewIdInput.setAttribute('type', 'hidden');
  reviewIdInput.setAttribute('name', 'review_id');
  reviewIdInput.setAttribute('id', 'review_id');
  reviewIdInput.value = 'review_id' in myReview ? myReview.review_id : '0';
  reviewForm.appendChild(reviewIdInput);

  const nameInput = document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('name', 'name');
  nameInput.setAttribute('aria-label', 'Your name (required)');
  nameInput.setAttribute('placeholder', '* Your name');
  if ('name' in myReview) {
    nameInput.value = myReview.name;
  }
  reviewForm.appendChild(nameInput);

  const rating = document.createElement('div');
  rating.className = 'rating';

  const ratingLabel = document.createElement('legend');
  ratingLabel.innerText = 'Please rate: ';
  rating.appendChild(ratingLabel);

  let ratingStars = 5;
  if ('rating' in myReview) {
    ratingStars = myReview.rating;
  }
  for (let i=5; i>=1; i--) {
    const starInput = document.createElement('input');
    starInput.setAttribute('type', 'radio');
    starInput.setAttribute('name', 'rating');
    starInput.setAttribute('id', `star${i}`);
    starInput.value = i;

    if (i === ratingStars) {
      starInput.setAttribute('checked', 'checked');
    }
    rating.appendChild(starInput);

    const starLabel = document.createElement('label');
    starLabel.setAttribute('for', `star${i}`);
    starLabel.innerText = i === 1 ? '1 star' : `${i} stars`;
    rating.appendChild(starLabel);
  }
  reviewForm.appendChild(rating);

  const comment = document.createElement('textarea');
  comment.setAttribute('name', 'comments');
  comment.setAttribute('placeholder', 'Your comment');
  if ('comments' in myReview) {
    comment.value = myReview.comments;
  }
  comment.setAttribute('aria-label', 'Your comment');
  reviewForm.appendChild(comment);

  const buttonsContainer = document.createElement('div');

  const submitButton = document.createElement('input');
  submitButton.setAttribute('type', 'submit');
  submitButton.value = 'Save';
  submitButton.onclick = (e) => {
    e.preventDefault();
    DBHelper.saveReview(serialize(document.getElementById('review-form'), { hash: true }), (error, response) => {
      if (error) {
        document.getElementById('review-info-label').innerText = error;
      } else {
        document.getElementById('review_id').value = response;
        document.getElementById('review-info-label').innerText = 'Saved';
        setTimeout(() => fillRestaurantHTML(self.restaurant), 1000);
      }
    });
  };
  buttonsContainer.appendChild(submitButton);
  buttonsContainer.className = 'buttons-container';

  if ('name' in myReview) {
    submitButton.classList.add('save-reduced');

    const deleteButton = document.createElement('input');
    deleteButton.setAttribute('type', 'submit');
    deleteButton.value = 'Delete';
    deleteButton.onclick = (e) => {
      e.preventDefault();
      DBHelper.deleteReview(serialize(document.getElementById('review-form'), { hash: true }), (error, response) => {
        if (error) {
          document.getElementById('review-info-label').innerText = error;
        } else {
          document.getElementById('review-info-label').innerText = response;
          document.getElementById('review-form').reset();
          setTimeout(() => fillRestaurantHTML(self.restaurant), 1000);
        }
      });
    };
    deleteButton.classList.add('delete-reduced');
    buttonsContainer.appendChild(deleteButton);
  }

  reviewForm.appendChild(buttonsContainer);

  const infoLabel = document.createElement('label');
  infoLabel.setAttribute('id', 'review-info-label');
  infoLabel.innerText = '';
  reviewForm.appendChild(infoLabel);

  formDiv.appendChild(reviewForm);
  li.appendChild(formDiv);

  return li;
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
  date.innerHTML = moment(review.updatedAt).format(timestampFormat);
  date.tabIndex = 0;
  li.appendChild(date);

  const rating = HTMLUtils.generateRatingStars(review.rating);
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
  breadcrumb.innerHTML = '';
  const homeLi = document.createElement('li');
  homeLi.innerHTML = '<a href="/">Home</a>';
  breadcrumb.appendChild(homeLi);
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