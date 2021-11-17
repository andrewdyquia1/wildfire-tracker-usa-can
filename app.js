const searchButton = document.querySelector('.search-button'), showAllButton = document.querySelector('.show-all-button'), wildfireList = document.querySelector('#wildfire-list')
let longitude = -118, latitude = 34//initial location is southern california
var mymap = L.map('mapid').setView([latitude, longitude], 9)//initiate map
let marker
var markersLayer = new L.LayerGroup();//creates a new object that places markers data inside
L.tileLayer('http://tile.stamen.com/terrain/{z}/{x}/{y}.png', {//lay map tiles
attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>',
maxZoom: 13
}).addTo(mymap)
const mapBoxAuthToken = 'pk.eyJ1IjoiYW5kcmV3ZHlxdWlhMSIsImEiOiJja3FxYmRldzUxYngxMnhzYnczemx3dWNxIn0.tqOwapc6rVt23F1atNIrWw'
let wildfireItems
let allWildfiresShown
const searchResults = document.querySelector('.search-results')


async function getMapBoxData(searchQuery){
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json?access_token=${mapBoxAuthToken}`)//searchQuery is the text from search input
        const data = await response.json()

    
        function retrieveSearchData(){
            //for each feature, get the name, type, latitude, and longitude of a place
            for(i = 0; i < data.features.length; i++){
                const placeName = data.features[i].place_name
                let placeType = data.features[i].place_type[0]
                const searchLat = data.features[i].center[1]
                const searchLong = data.features[i].center[0]
                if(placeType == 'poi'){//poi isn't exactly the easiest to understand
                    placeType = 'point of interest'
                }
                makeSearchItems(placeName, placeType, searchLat, searchLong)//create search item for each feature returned
            }
        }
        
        retrieveSearchData()//searches for features and creates a dom element from the data found
}

async function getWildfireData(filtered, searchClick, searchValue){
    //fetches wildfire data from nasa in json
    const response = await fetch('https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories/8')
    const data = await response.json()
    const wildfireEvents = data.events
    const filteredEvents = wildfireEvents.filter(event => event.geometries[0].coordinates[1] > latitude - 1 && event.geometries[0].coordinates[1] < latitude + 1 && event.geometries[0].coordinates[0] > longitude - 1 && event.geometries[0].coordinates[0] < longitude + 1)//the search area for filtered events consists of one coordinate value higher and one lower for each of the specified coordinates
    
    //filters event if using search, otherwise show all wildfires. addMarker function also creates child elements in wildfirelist parent.
    if(filtered && filteredEvents.length == wildfireEvents.length){//if filtered and the number of wildfire events is equal, set allWildfiresShown to true
        addMarker(wildfireEvents)//add all markers from nasa data
        allWildfiresShown = true//since filtered events length is the same as the raw data, this is the same as having all wildfires shown
    } else if(filtered){
        addMarker(filteredEvents)//add marker if within close distance of the coords
        allWildfiresShown = false
        
    } else {
        addMarker(wildfireEvents)//add all markers from nasa data
        allWildfiresShown = true
    }

    //add markers to map
    markersLayer.addTo(mymap)
    //if there are no wildfires, add child element to wildfire list
    if(wildfireList.children.length == 0){
        createWildfireItem('There are no wildfires here.', true)
    }

    function addMarker(events){
        //for loop adding markers for searched wildfire events, binding popups to them, then creating child elements in the wildfireList parent
        for(i = 0; i < events.length; i++){
                //coordinates from nasa wildfire data
                const wildfireEventsLat = events[i].geometries[0].coordinates[1]
                const wildfireEventsLong = events[i].geometries[0].coordinates[0]
                
                marker = L.marker([wildfireEventsLat, wildfireEventsLong])//create new marker object
                marker.bindPopup(events[i].title)//bind popup onto marker
                marker.on('click', highlightSelectedWildfireItem);//add click event listener to marker
                markersLayer.addLayer(marker)//add marker to layer group
                createWildfireItem(events[i].title, false)//create paragraph element
        }
    }

    function createWildfireItem(title, noWildfires){
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
    
    function retrieveWildfireData(searchClick, searchValue){
        //if the search button is clicked, run function
        if(searchClick){
            const str = searchValue//search value is the search input's text
            const regex = new RegExp(String.raw`\b${str}`, 'i')//matches the beginning of a word case-insensitive
            //for each wildfire event, get the name, latitude, and longitude and pass on the data to make dom element
            for(i = 0; i < wildfireEvents.length; i++){
                const wildfireEventsLat = wildfireEvents[i].geometries[0].coordinates[1]
                const wildfireEventsLong = wildfireEvents[i].geometries[0].coordinates[0]
                const wildfireName = wildfireEvents[i].title
                const placeName = wildfireName
                //create dom element from wildfire data
                if(regex.test(placeName)){
                    makeSearchItems(placeName, 'wildfire', wildfireEventsLat, wildfireEventsLong)
                }
            }
        } else {
            return
        }
    }  

    retrieveWildfireData(searchClick, searchValue)//searches for features and creates a dom element from the data found
}

function makeSearchItems(placeName, placeType, lat, long){

    function makeSearchItem(placeName, placeType, lat, long){
        //create dom element with the data from the apis
        const ItemDiv = document.createElement('div'), newPlace = document.createTextNode(placeName), newType = document.createTextNode(placeType), PlaceDiv = document.createElement('div'), TypeDiv = document.createElement('div')

        searchResults.appendChild(ItemDiv)
        ItemDiv.classList.add('item', 'flex-container')
        ItemDiv.appendChild(PlaceDiv)
        ItemDiv.appendChild(TypeDiv)
        PlaceDiv.appendChild(newPlace)
        TypeDiv.appendChild(newType)
        PlaceDiv.classList.add('search-location')
        TypeDiv.classList.add('location-type')

        ItemDiv.addEventListener('click', () => { acceptSearchQuery(lat, long) })//event listener for each item
    }

    function acceptSearchQuery(lat, long){
        //if clicked, move map to the provided coords, remove all the markers, find if there are wildfires in area of coords and remove search results
        latitude = lat
        longitude = long
        mymap.setView([latitude, longitude])//move map to coords
        
        markersLayer.clearLayers()//remove all markers
        removeAllChildren(wildfireList)//remove all children in wildfire list container
        getWildfireData(true, false)//1.attempting to make a filtered wildfire list, not trying to make new search result items
        removeAllChildren(searchResults)//remove all search items
        searchResults.classList.remove('active-results')//hide search results container
    }

    makeSearchItem(placeName, placeType, lat, long)//create search item after clicking search button
}


function showAllWildfires(){
    //click event on button, show all wildfires if results are filtered from search

    if(allWildfiresShown){//shows true if all wildfires in the raw data are displayed
        alert('All wildfires already shown.')
    } else {
        markersLayer.clearLayers()//remove all markers in the markersLayer
        removeAllChildren(wildfireList)//remove the children in the wildfire list container
        getWildfireData(false, false)//display all wildfires again
        alert('All wildfires now showing')
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

function removeAllChildren(parent){
    //remove all child elements of a parent container
    while(parent.firstChild) {
        parent.removeChild(parent.lastChild)
    }
}

async function getSearchData(){
    const searchInput = document.querySelector('.search-input')
    let searchQuery = 'Los Angeles'//eventually set this to user location

    if(searchInput.value == ''){//if empty return an alert
        alert('please enter text')
        return
    } else {
        searchQuery = searchInput.value//search input becomes search query in api calls
    }
    

    removeAllChildren(searchResults)//remove previous search's results

    await getWildfireData(false, true, searchQuery)//1. not filtering, 2. trying to access wildfire data, 3.this is the text from the search input
    await getMapBoxData(searchQuery)//uses text from search input
    searchInput.value = ''//reset value to no text

    //if there are no results from either api, say there are none, otherwise show search results
    if(searchResults.children.length == 0){
        alert('no wildfires or locations found in search')
    } else if(searchResults.children.length > 0){
        searchResults.classList.add('active-results')
    }
    
}

searchButton.addEventListener('click', getSearchData)
showAllButton.addEventListener('click', showAllWildfires)

getWildfireData(false, false)//1. not filtering, 2. not trying to access wildfire data