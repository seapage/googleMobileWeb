let restaurant;
var map;



/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
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
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;


    const pFavourite = document.getElementById('favourite');
    pFavourite.setAttribute("data-idRestaurant", restaurant.id);
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
            pFavourite.innerHTML = "<a title='Add "+restaurant.name+" to favourite restaurants'>Add to favourite <i class=\"far fa-heart\"></i></a>";
            DBHelper.makeUnFavourite(parseInt(this.getAttribute("data-idRestaurant")));
        }else{
            pFavourite.setAttribute("data-addedFavourite", "true");
            pFavourite.innerHTML = "<a title='Remove "+restaurant.name+" from favourite restaurants'>Remove from favourite <i class=\"fas fa-heart\"></i></a>";
            DBHelper.makeFavourite(parseInt(this.getAttribute("data-idRestaurant")));
        }

    })

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("alt","Restaurant "+restaurant.name+" inside")

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();


    const buttonReview = document.getElementById("sendReview")
    buttonReview.addEventListener("click",function () {
        var nicknameElem = document.getElementById("usernameForm");
        var msgElem = document.getElementById("msgForm");
        var ratingElem = document.getElementById("ratingForm");
        if(
            nicknameElem.value==""||
            msgElem.value==""||
            ratingElem.value==""
        ){
            alert("You fill inncorect data");
            return;
        }
        DBHelper.addReview(restaurant.id,nicknameElem.value, ratingElem.value, msgElem.value);
        nicknameElem.value=""
        msgElem.value=""
        ratingElem.value=5
        alert("Your review was added");

    })
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    coreBase.then(db => {
        return db.transaction('Reviews')
            .objectStore('Reviews').index('by-date').getAll();
    }).then(
        allObjs => {

            reviews = allObjs.filter((elem)=>{

              if(elem.data.restaurant_id == self.restaurant.id)
                return true;
              return false;

            })

            const container = document.getElementById('reviews-container');

            if (!reviews) {
                const noReviews = document.createElement('p');
                noReviews.innerHTML = 'No reviews yet!';
                container.appendChild(noReviews);
                return;
            }
            const ul = document.getElementById('reviews-list');

            reviews.map((elem)=>{
                ul.appendChild(createReviewHTML(elem.data));
            });
            container.appendChild(ul);

        }
    )



}



/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  var dateTime=new Date(review.updatedAt);
  name.innerHTML = '<i class="fas fa-user"></i> '+review.name+ " <span>"+dateTime.toLocaleString()+"</span>";
  name.className = "user_comment";
  li.appendChild(name);


  let stars = "";

  for(let i=0; i<review.rating; i++){
    stars = stars+'<i class="fas fa-star"></i>';
  }
  for(let i=0; i<5-review.rating; i++){
    stars = stars+'<i class="far fa-star"></i>';
  }

  stars = stars+"<span class='descVote'>";
  switch (review.rating){

    case 1:
      stars = stars+" Baby don't take me, no more.";
      break;
    case 2:
      stars = stars+" If i have to i will be there.";
      break;
    case 3:
      stars = stars+" Nice place!";
      break;
    case 4:
      stars = stars+" Excellent!";
      break;
    case 5:
      stars = stars+" I love it!";
      break;


  }
  stars = stars+"</span>";

  const rating = document.createElement('p');
  rating.innerHTML = stars;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = "commentBody";
  comments.innerHTML = review.comments;
  li.appendChild(comments);



  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = "<a class='linkBreadLast' aria-current='page'>"+restaurant.name+"</a>";
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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
}


DBHelper.loadAllRestaurant()