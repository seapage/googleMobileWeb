const coreBase = idb.open('RestaurantApp', 1, upgradeDB => {
    upgradeDB.createObjectStore('Restaurants', {keyPath: 'id'});
    upgradeDB.createObjectStore('ToUpd', {keyPath: 'id'});
    var reviews = upgradeDB.createObjectStore('Reviews', {keyPath: 'id'});
    reviews.createIndex("by-date","createdAt")
});

/**
 * Common database helper functions.
 */

class DBHelper {


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  static get DATABASE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  static loadAllRestaurant(){
    fetch(DBHelper.DATABASE_URL).then((resp)=>(resp.json())).then((jsonData)=>{
        coreBase.then(db => {
            const tx = db.transaction('Restaurants', 'readwrite');


            jsonData.map((elem)=>{
                tx.objectStore('Restaurants').put({
                    id: elem.id,
                    data: {...elem}
                }).then(()=>{

                  if(typeof updateRestaurants === "function")
                    updateRestaurants();

                });
            })

            return tx.complete;
        });

    })
    fetch(DBHelper.DATABASE_REVIEWS_URL+"/reviews").then((resp)=>(resp.json())).then((jsonData)=>{
        coreBase.then(db => {
            const tx = db.transaction('Reviews', 'readwrite');


            jsonData.map((elem)=>{
              console.log(elem);
                tx.objectStore('Reviews').put({
                    id: elem.id,
                    createdAt: elem.createdAt,
                    data: {...elem}
                });
            })

            return tx.complete;
        });

    })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
      coreBase.then(db => {
          return db.transaction('Restaurants')
              .objectStore('Restaurants').getAll();
      }).then(
          allObjs => callback(null, allObjs.map((elem=>elem.data)))
      ).catch((error)=>{
        callback(error, null)
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
      coreBase.then(db => {
          return db.transaction('Restaurants')
              .objectStore('Restaurants').get(parseInt(id));
      }).then(
          elem => callback(null,elem.data)
      ).catch((error)=>{
          callback(error, null)
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
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }

          const favCheckbox = document.getElementById('favCheckbox');
          if(favCheckbox.checked==true)
              results = results.filter(r => r.is_favorite == "true");

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
        const neighborhoods = restaurants.map((elem) => elem.neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
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
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }



    /**
     * Delete record.
     */
  static onlyDel(transaction, id){

      coreBase.then(db => {
          const tx = db.transaction(transaction, 'readwrite');
          tx.objectStore(transaction).delete(id)


          });
  }
    /**
     * Delete and add record.
     */
  static delAndAdd(transaction, id, obj){

        console.log(transaction)
        console.log(id)
        console.log(obj)
      coreBase.then(db => {
          const tx = db.transaction(transaction, 'readwrite');
          tx.objectStore(transaction).delete(id).then(()=>{
              const txd = db.transaction(transaction, 'readwrite');
              txd.objectStore(transaction).put({id, data: obj}).then(()=>{
            });


          });
          return tx.complete;
      });
  }

  /**
   * Unfavourite restaurant.
   */
  static makeUnFavourite(restaurant) {
      fetch(DBHelper.DATABASE_URL+"/"+restaurant+"/?is_favorite=false",{

          method: "PUT"

      }).then(()=>{
          console.log("fav changed");
          return true;
      }).catch(()=>{

          if(!isNaN(restaurant)){
              coreBase.then(db => {
                  const tx = db.transaction('ToUpd', 'readwrite');
                  tx.objectStore('ToUpd').put({
                      id: restaurant+"_favEdit",
                      data: {

                          id_res: restaurant,
                          type: 'like',
                          valueD: false

                      }
                  });
                  return tx.complete;
              });

          }


      })

      coreBase.then(db => {
          return db.transaction('Restaurants')
              .objectStore('Restaurants').get(parseInt(restaurant));
      }).then(
          elem => {
            console.log("unf")
              let objUpd = {
                  ...elem.data,
                  is_favorite: false
              }
              DBHelper.delAndAdd("Restaurants",parseInt(restaurant),objUpd)
          }
      )

  }


    /**
     * Make favourite restaurant.
     */
    static makeFavourite(restaurant) {
        fetch(DBHelper.DATABASE_URL+"/"+restaurant+"/?is_favorite=true",{

            method: "PUT"

        }).then(()=>{
          console.log("fav changed");
          return true;
        }).catch(()=>{
            if(!isNaN(restaurant)){
                coreBase.then(db => {
                    const tx = db.transaction('ToUpd', 'readwrite');
                    tx.objectStore('ToUpd').put({
                        id: restaurant+"_favEdit",
                        data: {

                            id_res: restaurant,
                            type: 'like',
                            valueD: true

                        }
                    });
                    return tx.complete;
                });

            }


        })

        coreBase.then(db => {
            return db.transaction('Restaurants')
                .objectStore('Restaurants').get(parseInt(restaurant));
        }).then(
            elem => {
                console.log("tr")
                let objUpd = {
                    ...elem.data,
                    is_favorite: true
                }
                DBHelper.delAndAdd("Restaurants",parseInt(restaurant),objUpd)
            }
        )
    }
    /**
     * Make favourite restaurant.
     */
    static addReview(restaurant, name, rating, comments) {
        var dateInt = Date.parse(new Date());
      var objToSend = {
          'restaurant_id':parseInt(restaurant),
          name,
          'rating': parseInt(rating),
          comments
      };
        fetch(DBHelper.DATABASE_REVIEWS_URL+"/reviews",{

            method: "POST",
            data: objToSend

        }).then(data=>data.json()).then((response)=>{


            var scheme = {
                ...objToSend,
                'createdAt': new Date(response.createdAt),
                'updatedAt': new Date(response.updatedAt),
                'id': response.id

            }
            coreBase.then(db => {
                const tx = db.transaction('Reviews', 'readwrite');


                    tx.objectStore('Reviews').put({
                        id: response.id,
                        createdAt: dateInt,
                        data: {...scheme}
                    });

                return tx.complete;
            });
            document.querySelector("#reviews-list").appendChild(createReviewHTML(scheme));
            if(document.querySelector("#reviews-container>p"))
            document.querySelector("#reviews-container>p").remove();


        }).catch(()=>{
                coreBase.then(db => {
                    const tx = db.transaction('ToUpd', 'readwrite');
                    tx.objectStore('ToUpd').put({
                        id: restaurant+"_reviewEdit",
                        data: {

                            id_res: restaurant,
                            type: 'review',
                            valueD: objToSend

                        }
                    });
                    return tx.complete;
                });

            var scheme = {
                ...objToSend,
                'id': dateInt,
                'createdAt': dateInt,
                'updatedAt': dateInt,

            }
            coreBase.then(db => {
                const tx = db.transaction('Reviews', 'readwrite');


                tx.objectStore('Reviews').put({
                    createdAt: dateInt,
                    id: Date.parse(new Date()),
                    data: {...scheme}
                });

                return tx.complete;
            });

            document.querySelector("#reviews-list").appendChild(createReviewHTML(scheme));
            if(document.querySelector("#reviews-container>p"))
            document.querySelector("#reviews-container>p").remove();
        })
    }

    static updateChanges(){
        coreBase.then(db => {
            return db.transaction('ToUpd')
                .objectStore('ToUpd').getAll();
        }).then( dataObj => {


            dataObj.map((elem)=>{


              let item = elem.data;
              switch (item.type){



                  case "like":

                        fetch(DBHelper.DATABASE_URL+"/"+item.id_res+"/?is_favorite="+item.valueD,{

                            method: "PUT"

                        }).then(()=>{

                            DBHelper.onlyDel("ToUpd",elem.id);


                        })
                      break;

                  case "review":

                      fetch(DBHelper.DATABASE_REVIEWS_URL+"/reviews",{

                          method: "POST",
                          data: item.valueD

                        }).then(()=>{

                            DBHelper.onlyDel("ToUpd",elem.id);


                        })
                      break;



              }

              return elem;
            })

        }).catch((error)=>{

        });
    }

}


