if (document.documentElement.clientWidth > 500) {
    function developer_open() {
        document.getElementById("developer").style.width = "90%";
        setTimeout(function() {
            document.getElementById("developer").style.color = "white";
        }, 1000)
    }
    setTimeout(developer_open, 1000)
    function project_open() {
        document.getElementById("project").style.width = "90%";
        setTimeout(function() {
            document.getElementById("project").style.color = "white";
        }, 1000)
    }
    setTimeout(project_open, 1000)
} 
