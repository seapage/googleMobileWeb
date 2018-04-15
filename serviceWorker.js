self.addEventListener('fetch', function(event) {
    const port = 8000;

    return event.respondWith(
        caches.open('fileStore').then((cacheOpend)=>{
            let linkToOpen = event.request;
    if(event.request.url.indexOf("restaurant.html") != -1){
        linkToOpen = `http://localhost:${port}/restaurant.html`;
    }
    return cacheOpend.match(linkToOpen).then((response)=>{

            return response || fetch(linkToOpen).then(function(response) {
                cacheOpend.put(linkToOpen, response.clone());
                return response;
            });

})



}))})


self.addEventListener('install', function(event) {
    caches.open('fileStore').then((cacheOpend) => {
        return cacheOpend.addAll([
            '/restaurant.html',
            '/js/restaurant_info.js',
            '/js/dbhelper.js',
            '/'
        ])})
});



