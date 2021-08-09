
function get_pldata() {
    var plrad = document.getElementById("plrad").value;
    var plmass = document.getElementById("plmass").value;
    if(plrad != undefined) {
        plrad = parseFloat(plrad)
        document.getElementById("plradout").innerHTML = "Planet Radius: " + plrad;
    }
    if(plmass != undefined) {
        plmass = parseFloat(plmass)
        document.getElementById("plmassout").innerHTML = "Planet Mass: " + plmass;
    }
    fetch('/plmtrtmconv', { 

        // Declare what type of data we're sending
        headers: {
        'Content-Type': 'application/json'
        },
    
        // Specify the method
        method: 'POST',
    
        // A JSON payload
        body: JSON.stringify({
            "plmass": plmass,
            "plrad": plrad
        })
    }).then(function (response) { // At this point, Flask has printed our JSON
        return response.text();
    }).then(function (text) {
        returned_obj = JSON.parse(text);
        if (returned_obj.plmass) {
            plmass = returned_obj.plmass;
            document.getElementById("plmassout").innerHTML = "Planet Mass: " + plmass;
        }
        if (returned_obj.plrad) {
            plmass = returned_obj.plrad;
            document.getElementById("plradout").innerHTML = "Planet Radius: " + plrad;
        }
    })
}

document.getElementById("plgo").onclick = get_pldata;

function checkplmass() {
    if (document.getElementById("plmass").value) {
        document.getElementById("plrad").disabled = true;
    }
    else {
        document.getElementById("plrad").disabled = false;
    }
}

document.getElementById("plrad").onfocus = checkplmass;

function checkplradius() {
    if (document.getElementById("plrad").value) {
        document.getElementById("plmass").disabled = true;
    }
    else {
        document.getElementById("plmass").disabled = false;
    }
}

document.getElementById("plmass").onfocus = checkplradius;

