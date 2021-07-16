const searchButton = document.querySelector('.search-button'), showAllButton = document.querySelector('.show-all-button'), wildfireList = document.querySelector('#wildfire-list')
let longitude = -118, latitude = 34//initial location is southern california
var mymap = L.map('mapid').setView([latitude, longitude], 9)//initiate map
let marker
var markersLayer = new L.LayerGroup();//creates a new object that places markers data inside
L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {//lay map tiles
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    maxZoom: 13
}).addTo(mymap)
const mapBoxAuthToken = 'pk.eyJ1IjoiYW5kcmV3ZHlxdWlhMSIsImEiOiJja3FxYmRldzUxYngxMnhzYnczemx3dWNxIn0.tqOwapc6rVt23F1atNIrWw'
let wildfireItems
let allWildfiresShown

async function getMapBoxData(){
        const searchInput = document.querySelector('.search-input')
        let zipCode = 92867//eventually set this to user location

        assignValue()//need to place function here so that the desired zipcode is placed in the response variable
        
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${mapBoxAuthToken}`)
        const data = await response.json()
        const zipCodeLat = data.features[0].center[1]
        const zipCodeLong = data.features[0].center[0]
        
        function assignValue(){
            if(searchInput.value == ''){//if empty return and alert
                alert('please enter a zipcode')
                return
            } else{
                zipCode = searchInput.value
                searchInput.value = ''//reset value to no text
            }
        }//usage of global variables latitude and longitude as filteredEvents variable in getWildfireData function needs zipcode data
        latitude = zipCodeLat
        longitude = zipCodeLong
        mymap.setView([latitude, longitude])//move map to coords
        markersLayer.clearLayers()//remove all markers
        removeAllChildren()//remove all children in wildfire list container
        getWildfireData(true)
}

async function getWildfireData(filtered){
    //fetches wildfire data from nasa in json
    const response = await fetch('https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories/8')
    const data = await response.json()
    const wildfireEvents = data.events
    const filteredEvents = wildfireEvents.filter(event => event.geometries[0].coordinates[1] > latitude - 1 && event.geometries[0].coordinates[1] < latitude + 1 && event.geometries[0].coordinates[0] > longitude - 1 && event.geometries[0].coordinates[0] < longitude + 1)//the search area for filtered events consists of one coordinate value higher and one lower for each of the specified coordinates
    
    //filters event if using zip code search, otherwise show all wildfires. addMarker function also creates child elements in wildfirelist parent.
    if(filtered && filteredEvents.length == wildfireEvents.length){//if filtered and the number of wildfire events is equal, set allWildfiresShown to true
        addMarker(wildfireEvents)//add all markers from nasa data
        allWildfiresShown = true//since filtered events length is the same as the raw data, this is the same as having all wildfires shown
    } else if(filtered){
        addMarker(filteredEvents)//add marker if within close distance of the zipcode coords
        allWildfiresShown = false
    } else {
        addMarker(wildfireEvents)//add all markers from nasa data
        allWildfiresShown = true
    }

    //add markers to map
    markersLayer.addTo(mymap)
    //if there are no wildfires, add child element to wildfire list
    if(wildfireList.children.length == 0){
        createElements('There are no wildfires. When you search, make sure you add a valid zip code.', true)
    }

    function addMarker(events){
        //for loop adding markers for searched wildfire events, binding popups to them, then creating child elements in the wildfireList parent
        for(i = 0; i < events.length; i++){
                //coordinates from nasa wildfire data
                const wildfireEventsLat = events[i].geometries[0].coordinates[1]
                const wildfireEventsLong = events[i].geometries[0].coordinates[0]

                marker = L.marker([wildfireEventsLat, wildfireEventsLong])//create new marker object
                marker.bindPopup(wildfireEvents[i].title)//bind popup onto marker
                marker.on('click', highlightSelectedWildfireItem);//add click event listener to marker
                markersLayer.addLayer(marker)//add marker to layer group
                createElements(events[i].title, false)//create paragraph element
        }
    }

    function createElements(title, noWildfires){
            // creates new paragraph element as a child to the wildfire list div and inserts text
            const newParagraph = document.createElement('p'), newText = document.createTextNode(title)
            
            wildfireList.appendChild(newParagraph)//add new paragraph child to wildfire list
            newParagraph.appendChild(newText)//add text to newly created paragraph child
            newParagraph.classList.add('wildfire-item')//add class
            //if there are no wildfires, do not add centerMap function, otherwise add it
            if(noWildfires){
                return
            } else {
                newParagraph.addEventListener('click', centerMap)
            }
            
        }
        
    function centerMap(){
    // when clicking on a wildfire item, the map will move to the coordinates of that item and open a popup
        wildfireItems = document.querySelectorAll('.wildfire-item')
        wildfireItems.forEach(item => item.classList.remove('wildfire-item-border'))
        this.classList.add('wildfire-item-border')

        for(i = 0; i < markersLayer.getLayers().length; i++){
            const wildfirePopups = markersLayer.getLayers()[i]._popup._content
            const chosenWildfireLat = markersLayer.getLayers()[i]._latlng.lat
            const chosenWildfireLng =  markersLayer.getLayers()[i]._latlng.lng
            //checks wildfire paragraph text and compares it with popup text
            if(this.innerText == wildfirePopups){
                mymap.setView([chosenWildfireLat, chosenWildfireLng], 13)//if text matches, move map to matched marker's location via latitude and longitude
                markersLayer.getLayers()[i].openPopup()//open popup bound to the marker
            }
        } 
    }
}

function showAllWildfires(){
    //click event on button, show all wildfires if results are filtered from the zip code search

    if(allWildfiresShown){//shows true if all wildfires in the raw data are displayed
        alert('All wildfires already shown.')
    } else {
        markersLayer.clearLayers()//remove all markers in the markersLayer
        removeAllChildren()//remove the children in the wildfire list container
        getWildfireData(false)//display all wildfires again
    }
}

function highlightSelectedWildfireItem(e){
// by clicking a marker, the wildfire item in the wildfire list corresponding to the marker is highlighted
    wildfireItems = document.querySelectorAll('.wildfire-item')
    var popup = e.target.getPopup()
    var content = popup.getContent()
    
    wildfireItems.forEach(item => item.classList.remove('wildfire-item-border'))//remove the wildfire item border class on every wildfire item
    // loops through wildfire items and compares content text to paragraph text. If there's a match, highlight the wildfire item in the wildfire list container
    for(i = 0; i < wildfireItems.length; i++){
        if(content == wildfireItems[i].innerText){
            wildfireItems[i].classList.add('wildfire-item-border')
        }
    }
    
}

/*function cancelHighlight(e){
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
}*/

function removeAllChildren(){
    //remove all child elements in wildfire list container
    while(wildfireList.firstChild) {
        wildfireList.removeChild(wildfireList.lastChild)
    }
}

//window.addEventListener('click', cancelHighlight);
searchButton.addEventListener('click', getMapBoxData)
showAllButton.addEventListener('click', showAllWildfires)

getWildfireData(false)
//refreshes page every hour
setInterval(function(){ location.reload()}, 3600000)