let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []



DBHelper.loadAllRestaurant();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();

  google.maps.event.addListenerOnce(self.map, 'tilesloaded', ()=>{

    elem = document.querySelectorAll("#map *")
      elem.forEach((item)=>{

        item.setAttribute("tabindex", -1)
      })

  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');



  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.setAttribute("role","article")

  const image = document.createElement('img');
  image.setAttribute("alt","Inside photo of "+restaurant.name+" restaurant")
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const pFavourite = document.createElement('p');
  pFavourite.setAttribute("data-idRestaurant", restaurant.id);
  pFavourite.className = "favouriteButton";
  if(restaurant.is_favorite&&restaurant.is_favorite!="false"){
      pFavourite.setAttribute("data-addedFavourite", "true");
      pFavourite.innerHTML = "<a title='Remove "+restaurant.name+" from favourite restaurants'>Remove from favourite <i class=\"fas fa-heart\"></i></a>";
  }else{
      pFavourite.setAttribute("data-addedFavourite", "false");
      pFavourite.innerHTML = "<a title='Add "+restaurant.name+" to favourite restaurants'>Add to favourite <i class=\"far fa-heart\"></i></a>";
  }


    pFavourite.addEventListener("click",function(){
      if(this.getAttribute("data-addedFavourite")=="true"){
          pFavourite.setAttribute("data-addedFavourite", "false");
          pFavourite.innerHTML =  "<a title='Add "+restaurant.name+" to favourite restaurants'>Add to favourite <i class=\"far fa-heart\"></i></a>";
          DBHelper.makeUnFavourite(parseInt(this.getAttribute("data-idRestaurant")));
      }else{
          pFavourite.setAttribute("data-addedFavourite", "true");
          pFavourite.innerHTML = "<a title='Remove "+restaurant.name+" from favourite restaurants'>Remove from favourite <i class=\"fas fa-heart\"></i></a>";
          DBHelper.makeFavourite(parseInt(this.getAttribute("data-idRestaurant")));
      }

    })
    li.append(pFavourite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.setAttribute("aria-label","See detail "+restaurant.name+" restaurant")
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}




