const searchButton = document.querySelector('.search-button'), wildfireList = document.querySelector('#wildfire-list');
let longitude = -118, latitude = 34
//let markerLat = latitude, markerLong = longitude
var mymap = L.map('mapid').setView([latitude, longitude], 9)
var circle = L.circle([latitude, longitude], {radius: 600000})
let marker
var markersLayer = new L.LayerGroup();
L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    maxZoom: 13
}).addTo(mymap);
const mapBoxAuthToken = 'pk.eyJ1IjoiYW5kcmV3ZHlxdWlhMSIsImEiOiJja3FxYmRldzUxYngxMnhzYnczemx3dWNxIn0.tqOwapc6rVt23F1atNIrWw'
let wildfireItems
let markerArr = []

async function getMapBoxData(){
        const searchInput = document.querySelector('.search-input')
        let zipCode = 92867

        assignValue()
        
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${mapBoxAuthToken}`);
        const data = await response.json();
        const zipCodeLat = data.features[0].center[1]
        const zipCodeLong = data.features[0].center[0]

        function assignValue(){
            if(searchInput.value == ''){
                alert('please enter a zipcode')
                return
            } else{
                zipCode = searchInput.value
                searchInput.value = ''
            }
        }
        
        latitude = zipCodeLat
        longitude = zipCodeLong
        mymap.setView([latitude, longitude])
        markersLayer.clearLayers()
        getWildfireData(true)
}

async function getWildfireData(filtered){
//fetches wildfire data from nasa in json
    const response = await fetch('https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories/8');
    const data = await response.json();
    const wildfireEvents = data.events
    const filteredEvents = wildfireEvents.filter(event => event.geometries[0].coordinates[1] > latitude - 1 && event.geometries[0].coordinates[1] < latitude + 1 && event.geometries[0].coordinates[0] > longitude - 1 && event.geometries[0].coordinates[0] < longitude + 1)

    console.log(filteredEvents, 'filtered')
    console.log(wildfireEvents)
    if(filtered){
        addMarker(filteredEvents)
    } else{
        addMarker(wildfireEvents)
    }

    markersLayer.addTo(mymap)

    function addMarker(events){

        for(i = 0; i < events.length; i++){
                const wildfireEventsLat = events[i].geometries[0].coordinates[1]
                const wildfireEventsLong = events[i].geometries[0].coordinates[0]
                //addMarker(wildfireEventsLat, wildfireEventsLong, highlightSelectedWildfireItem, wildfireEvents[i].title)
                //latitude = lat, longitude = long
                marker = L.marker([wildfireEventsLat, wildfireEventsLong])
                marker.bindPopup(wildfireEvents[i].title)
                marker.on('click', highlightSelectedWildfireItem);
                markersLayer.addLayer(marker)
                markerArr.push(marker)
                createElements(events[i].title, i + 1);
        }
        
    }
    function createElements(title, number){
        // creates new paragraph element as a child to the wildfire list div and inserts text
            const newParagraph = document.createElement('p');
            const newText = document.createTextNode(title);
            
            wildfireList.appendChild(newParagraph);
            newParagraph.appendChild(newText);
            newParagraph.classList.add(`wildfire-${number}`, 'wildfire-item');
            newParagraph.addEventListener('click', centerMap)
        }
        
        
        function centerMap(){
        // when clicking on a wildfire item, the map will move to the coordinates of that item and open a popup
            wildfireItems = document.querySelectorAll('.wildfire-item');
            wildfireItems.forEach(item => item.classList.remove('wildfire-item-border'));
            this.classList.add('wildfire-item-border');
        
            
            for(i = 0; i < markerArr.length; i++){
                const wildfirePopups = markerArr[i]._popup._content
                const chosenWildfireLat = markerArr[i]._latlng.lat
                const chosenWildfireLng =  markerArr[i]._latlng.lng

                //checks wildfire paragraph text and compares it with popup text
                if(this.innerText == wildfirePopups){
                    mymap.setView([chosenWildfireLat, chosenWildfireLng], 13)//if text matches, move map to matched marker's location via latitude and longitude
                    markerArr[i].openPopup()
                }
            }   

            console.log(markerArr[3])
        }
}

function highlightSelectedWildfireItem(e){
// by clicking a marker, the wildfire item in the wildfire list corresponding to the marker is highlighted
    wildfireItems = document.querySelectorAll('.wildfire-item');
    var popup = e.target.getPopup();
    var content = popup.getContent();
    
    wildfireItems.forEach(item => item.classList.remove('wildfire-item-border'));

    for(i = 0; i < wildfireItems.length; i++){
        if(content == wildfireItems[i].innerText){
            wildfireItems[i].classList.add('wildfire-item-border');
        }
    }
    
}

function cancelHighlight(e){
//checks if wildfire item border class is true, if yes check if it is clicking any of the elements that is not supposed to remove the highlight when clicked on, and if not, remove the class that gives the border style
    wildfireItems = document.querySelectorAll('.wildfire-item');
    for(i = 0; i < wildfireItems.length; i++){
        if(wildfireItems[i].classList[2] == 'wildfire-item-border'){
            if (e.target.classList[1] == 'wildfire-item' || e.target.id == 'mapid' || e.target.classList[0] == 'leaflet-marker-icon' || e.target.classList[0] == 'leaflet-popup-content' || e.target.classList[0] == 'leaflet-popup-content-wrapper'){
                return;
            } else {
                wildfireItems.forEach(item => item.classList.remove('wildfire-item-border'));
            }
        } 
    }
}

window.addEventListener('click', cancelHighlight);
// ['click','keydown'].forEach( evt => 
//     searchButton.addEventListener(evt, getMapBoxData, false)
// );
searchButton.addEventListener('click', getMapBoxData)
getWildfireData(false)
//refreshes page every hour
setInterval(function(){ location.reload()}, 3600000)








//THINGS TO DO

//Limit markers to within a (50?) mile radius of searched zip code
//Have something to show in the wildfire list if no wildfires are found in searched radius
//Remove markers when a new search is conducted