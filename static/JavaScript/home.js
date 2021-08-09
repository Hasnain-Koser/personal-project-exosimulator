window.onscroll = function() {show_containers()};

function show_containers() {
    if (document.documentElement.scrollTop >= 250){
        document.getElementById('containers').style.opacity = "1";
    }
}
 