


//The Initial Zoom and Center of your Map
let map = L.map('map', {
    center: [40.7826, -73.9656],
    zoom: 12
});

//The Raster Tiles that you plug in, I'm using Maptiler. 
L.tileLayer('https://api.maptiler.com/maps/topo-v2/{z}/{x}/{y}.png?key=v6ivVQaYw1ya6iP8Cjlu').addTo(map);

let markers = [];


function preloadImages(locations, callback) {
    let loadedCounter = 0;
    const totalImages = locations.length;

    locations.forEach(location => {
        const img = new Image();
        img.onload = () => {
            loadedCounter++;
            if (loadedCounter === totalImages) {
                callback();  // All images are loaded
            }
        };
        img.onerror = () => {
            console.error('Error loading image:', location.iconFilepath);
        };
        img.src = location.iconFilepath;
    });
}


//The data you're using to move you're Icons around. 
fetch("Locations.json")
    .then(response => response.json())
    .then(data => {

        preloadImages(data.locations, () => {
            data.locations.forEach(location => {

                //This creates an Icon with an image designated from our file path
                //We'll later attah this to a popup
                let customIcon = L.icon({
                    iconUrl: location.iconFilepath,
                    iconSize: [45, 45],
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -76]
                });

                //This is the actual "Icon Marker" that will be seen on the Map
                // We put in the first Location and the custom Icon.
                let marker = L.marker(location.LatLon[0], { icon: customIcon }).addTo(map);


                //This is the PopUp HTML you can fill this with whatever you want
                //If you don't want this just get ride of this and the marker.bindPopup
                let popUpDiv = `
        <div>
          <h1>${location.name}</h1>
          You can add information which you want to pop up in this div here,
          you can even add a picture:
          <br>
          <br>
          <section style="text-align: center">
          <img src=${location.iconFilepath} style="width:90px"> 
          </section>
        </div>
      `;

                marker.bindPopup(popUpDiv);


                //This Pushes the points to our marker array so we can interpolate between the
                // current one and the next one.
                markers.push({
                    marker: marker,
                    waypoints: location.LatLon,
                    currentIndex: 0
                });
            });
        });
    })
    .catch(error => console.error('Error loading the locations:', error));


//when the button is pressed we use the functions below to 
// - ease between the points, by comparing the current location, next location 
// and slowly shifting the amount that we interplolate between them to make the transition smooth.
document.getElementById('animateBtn').addEventListener('click', () => {
    markers.forEach(item => {
        let nextIndex = (item.currentIndex + 1) % item.waypoints.length;
        animateMarker(item.marker, item.waypoints[item.currentIndex], item.waypoints[nextIndex], 3000);
        item.currentIndex = nextIndex;
    });
});


function interpolateLatLng(latlng1, latlng2, fraction) {
    const easedFraction = easeInOutCubic(fraction);  // Apply easing to the fraction
    return [
        latlng1[0] + (latlng2[0] - latlng1[0]) * easedFraction,
        latlng1[1] + (latlng2[1] - latlng1[1]) * easedFraction
    ];
}

function animateMarker(marker, startLatlng, endLatlng, duration) {
    const startTime = performance.now();
    const moveMarker = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const fraction = elapsedTime / duration;

        if (fraction < 1) {
            const newLatlng = interpolateLatLng(startLatlng, endLatlng, fraction);
            marker.setLatLng(new L.LatLng(newLatlng[0], newLatlng[1]));
            requestAnimationFrame(moveMarker);
        } else {
            marker.setLatLng(new L.LatLng(endLatlng[0], endLatlng[1]));
        }
    };
    requestAnimationFrame(moveMarker);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

