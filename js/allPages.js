

var offlineWarning = document.getElementById("offline")

window.addEventListener('load', function() {
    updateOnlineStatus();
});



function updateOnlineStatus(event) {
    var isOnline = navigator.onLine ? true : false;

    if(!isOnline){
        offlineWarning.innerText = "You are currently offline, all data will be save if you connect to internet."
    }else{
        offlineWarning.innerText="";
        DBHelper.updateChanges();
    }
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);