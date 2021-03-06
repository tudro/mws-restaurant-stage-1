import DBHelper from "../dbhelper";

/**
 * Common HTML helper functions.
 */
export default class HTMLUtils {

  /**
   * Generate favorites badge
   */
  static generateBadge(badge, restaurant) {
    badge.className = 'badge';
    badge.setAttribute('role', 'button');
    badge.tabIndex = 0;

    if (restaurant.is_favorite === 'true') {
      badge.classList.toggle('badge-active');
      badge.setAttribute('aria-label', `Remove ${restaurant.name} from favorites.`);
      badge.setAttribute('title', `Remove ${restaurant.name} from favorites.`);
    } else {
      badge.setAttribute('aria-label', `Add ${restaurant.name} to favorites.`);
      badge.setAttribute('title', `Add ${restaurant.name} to favorites.`);
    }
    badge.onclick = () => {
      const isFavorite = !badge.classList.contains('badge-active');
      DBHelper.updateFavorites(restaurant.id, isFavorite);
      badge.classList.toggle('badge-active');
      if (isFavorite) {
        badge.setAttribute('aria-label', `Remove ${restaurant.name} from favorites.`);
        badge.setAttribute('title', `Remove ${restaurant.name} from favorites.`);
      } else {
        badge.setAttribute('aria-label', `Add ${restaurant.name} to favorites.`);
        badge.setAttribute('title', `Add ${restaurant.name} to favorites.`);
      }
    };

    badge.onkeypress = (e) => {
      const keycode = (e.keyCode ? e.keyCode : e.which);
      if (keycode === 13) {
        const isFavorite = !badge.classList.contains('badge-active');
        DBHelper.updateFavorites(restaurant.id, isFavorite);
        badge.classList.toggle('badge-active');
        if (isFavorite) {
          badge.setAttribute('aria-label', `Remove ${restaurant.name} from favorites.`);
        } else {
          badge.setAttribute('aria-label', `Add ${restaurant.name} to favorites.`);
        }
      }
    };

    return badge;
  }

  /**
   * Generate rating stars
   */
  static generateRatingStars(value) {
    const rating = document.createElement('p');
    for (let i=1; i<=5; i++) {
      const star = document.createElement('span');
      star.classList.add('fa');
      star.classList.add('fa-star');
      if (i <= value) {
        star.classList.add(['checked']);
      }
      rating.appendChild(star);
    }
    rating.setAttribute('aria-label', `Rating: ${value} out of 5.`);
    rating.tabIndex = 0;
    return rating;
  }
}