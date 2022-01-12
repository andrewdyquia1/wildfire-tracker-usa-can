const searchButton = document.querySelector(".search-button"),
  showAllButton = document.querySelector(".show-all-button"),
  wildfireTable = document.querySelector("#wildfire-table");
let wildfireDataLoaded = false;
let loaderActive = false;
let searchComplete;

let longitude = -118,
  latitude = 34; //initial location is southern california
// var mymap = L.map("mapid").setView([latitude, longitude], 9); //initiate map
let marker;
var markersLayer = new L.LayerGroup(); //creates a new object that places markers data inside
const mapBoxAuthToken =
  "pk.eyJ1IjoiYW5kcmV3ZHlxdWlhMSIsImEiOiJja3FxYmRldzUxYngxMnhzYnczemx3dWNxIn0.tqOwapc6rVt23F1atNIrWw";
//   L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
//     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
//     maxZoom: 18,
//     id: 'mapbox/streets-v11',
//     tileSize: 512,
//     zoomOffset: -1,
//     accessToken: mapBoxAuthToken,
// }).addTo(mymap);
let wildfireItems;
let allWildfiresShown;
const searchResults = document.querySelector(".search-results");

async function getMapBoxData(searchQuery) {
  const encodedSearchQuery = encodeURIComponent(searchQuery)
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedSearchQuery}.json?access_token=${mapBoxAuthToken}`
  ); //searchQuery is the text from search input
  const data = await response.json();

  function retrieveSearchData() {
    //for each feature, get the name, type, latitude, and longitude of a place
    for (i = 0; i < data.features.length; i++) {
      const placeName = data.features[i].place_name;
      let placeType = data.features[i].place_type[0];
      const searchLat = data.features[i].center[1];
      const searchLong = data.features[i].center[0];
      if (placeType == "poi") { //poi isn't exactly the easiest to understand
        placeType = "point of interest";
      }
      makeSearchItem('searchItem', placeName, placeType, searchLat, searchLong); //create search item for each feature returned
    }
  }

  retrieveSearchData(); //searches for features and creates a dom element from the data found
}

let wildfireArray = []; // stores wildfire data

async function getWildfireData() {
  //fetches wildfire data from nasa in json
  const response = await fetch("https://eonet.gsfc.nasa.gov/api/v3/categories/8");
  const data = await response.json();
  const wildfireEvents = data.events;
  // get necessary data 
  for (i = 0; i < wildfireEvents.length; i++) {
    // console.log(data)
    wildfireArray.push({
      title: wildfireEvents[i].title,
      latitude: wildfireEvents[i].geometry[0].coordinates[1],
      longitude: wildfireEvents[i].geometry[0].coordinates[0],
    });
  }
  
  createMapAndTableItems(false)
  wildfireDataLoaded = true
}

function createMapAndTableItems(filtered) {
  const filteredEvents = wildfireArray.filter(
    (event) =>
      event.latitude > latitude - 1 &&
      event.latitude < latitude + 1 &&
      event.longitude > longitude - 1 &&
      event.longitude < longitude + 1
  ); //the search area for filtered events consists of one coordinate value higher and one lower for each of the specified coordinates

  //filters event if using search, otherwise show all wildfires. addMarker function also creates child elements in wildfirelist parent.
  if (filtered && filteredEvents.length == wildfireArray.length) {//if filtered and the number of wildfire events is equal, set allWildfiresShown to true
    addMarker(wildfireArray); //add all markers from nasa data
    allWildfiresShown = true; //since filtered events length is the same as the raw data, this is the same as having all wildfires shown
  } else if (filtered) {
    addMarker(filteredEvents); //add marker if within close distance of the coords
    allWildfiresShown = false;
  } else if(filtered == false){
    addMarker(wildfireArray); //add all markers from nasa data
    allWildfiresShown = true;
  }

  //add markers to map
  markersLayer.addTo(mymap);
  //if there are no wildfires, add child element to wildfire list denoting no wildfires in search area
  if (wildfireTable.children.length == 0) {
    createWildfireTableItem("There are no wildfires here.", true);
  }

  
  function addMarker(events) {
    //for loop adding markers for searched wildfire events, binding popups to them, then creating child elements in the wildfireTable parent
    for (i = 0; i < events.length; i++) {
      //coordinates from nasa wildfire data
      const wildfireEventsLat = events[i].latitude;
      const wildfireEventsLong = events[i].longitude;
      marker = L.marker([wildfireEventsLat, wildfireEventsLong]); //create new marker object
      marker.bindPopup(events[i].title); //bind popup onto marker
      marker.on("click", highlightSelectedWildfireItem); //add click event listener to marker
      markersLayer.addLayer(marker); //add marker to layer group
      createWildfireTableItem(events[i].title, false); //create paragraph element
    }
  }

  function createWildfireTableItem(title, noWildfires) {
    // creates new paragraph element as a child to the wildfire list div and inserts text
    const newParagraph = document.createElement("p"),
      newText = document.createTextNode(title);

    wildfireTable.appendChild(newParagraph); //add new paragraph child to wildfire table
    newParagraph.appendChild(newText); //add text to newly created paragraph child
    newParagraph.classList.add("wildfire-item"); //add class
    //if there are no wildfires, do not add centerMap function, otherwise add it
    if (noWildfires) {
      return;
    } else {
      newParagraph.addEventListener("click", centerMap);
    }
  }

  function centerMap() {
    // when clicking on a wildfire table item, the map will move to the coordinates of that item and open a popup
    wildfireItems = document.querySelectorAll(".wildfire-item");
    wildfireItems.forEach((item) => item.classList.remove("wildfire-item-border"));
    this.classList.add("wildfire-item-border");

    for (i = 0; i < markersLayer.getLayers().length; i++) {
      const wildfirePopups = markersLayer.getLayers()[i]._popup._content;
      const chosenWildfireLat = markersLayer.getLayers()[i]._latlng.lat;
      const chosenWildfireLng = markersLayer.getLayers()[i]._latlng.lng;
      //checks wildfire paragraph text and compares it with popup text
      if (this.innerText == wildfirePopups) {
        mymap.setView([chosenWildfireLat, chosenWildfireLng], 13); //if text matches, move map to matched marker's location via latitude and longitude
        markersLayer.getLayers()[i].openPopup(); //open popup bound to the marker
      }
    }
  }
}
  

function searchWildfireData(searchValue) {
    //when text input received, run function
    const str = searchValue.replace(/[/.*+?^${}()|[\]\\]/g, '\\$&'); //search value is the search input's text but escaping special regex chars
    const regex = new RegExp(String.raw`\b${str}`, "i"); //matches the beginning of a word case-insensitive

    //for each wildfire event, get the name, latitude, and longitude and pass on the data to make dom element
    for (i = 0; i < wildfireArray.length; i++) {
      const wildfireEventsLat = wildfireArray[i].latitude;
      const wildfireEventsLong = wildfireArray[i].longitude;
      const wildfireName = wildfireArray[i].title;

      //create search element from matched wildfire data
      if (regex.test(wildfireName)) {
        makeSearchItem('searchItem', wildfireName, "wildfire", wildfireEventsLat, wildfireEventsLong);
    }
  }
}

  
function makeSearchItem(type, placeName, placeType, lat, long) {
    //create dom element with the data from the apis
    const itemDiv = document.createElement("div"),
      newPlace = document.createTextNode(placeName),
      newType = document.createTextNode(placeType),
      placeDiv = document.createElement("div"),
      typeDiv = document.createElement("div");

    searchResults.appendChild(itemDiv);
    itemDiv.classList.add("item", "flex-container");

    if(type == 'searchItem'){
      itemDiv.classList.add('search-item');
      itemDiv.appendChild(placeDiv);
      itemDiv.appendChild(typeDiv);
      placeDiv.appendChild(newPlace);
      typeDiv.appendChild(newType);
      placeDiv.classList.add("search-location");
      typeDiv.classList.add("location-type");
      itemDiv.setAttribute("data-lat", lat);
      itemDiv.setAttribute("data-long", long);
      itemDiv.addEventListener("click", () => {
        acceptSearchQuery(lat, long);
      }); //event listener for each search item
    } else if(type == 'noResultsItem'){
      const noResultsText = document.createTextNode('No results found, try again')
      itemDiv.appendChild(noResultsText)
    }
}

function acceptSearchQuery(lat, long) {
  //if clicked, move map to the provided coords, remove all the markers, find if there are wildfires in area and remove search results
  latitude = lat;
  longitude = long;
  mymap.setView([latitude, longitude]); //move map to coords

  markersLayer.clearLayers(); //remove all markers
  removeAllChildren(wildfireTable); //remove all children in wildfire list container
  createMapAndTableItems(true); //1.attempting to make a filtered wildfire table list
  removeAllChildren(searchResults); //remove all search items
  searchResults.classList.remove("active-results"); //hide search results container
  searchInput.value = "";
}

function showAllWildfires() {
  //click event on button, show all wildfires if results are filtered from search
  if (allWildfiresShown) {
    //shows true if all wildfires in the raw data are displayed
    alert("All wildfires already shown.");
  } else {
    markersLayer.clearLayers(); //remove all markers in the markersLayer
    removeAllChildren(wildfireTable); //remove the children in the wildfire list container
    createMapAndTableItems(false); //display all wildfires again
    alert("All wildfires now showing");
  }
}

function highlightSelectedWildfireItem(e) {
  // by clicking a marker, the wildfire item in the wildfire table corresponding to the marker is highlighted
  wildfireItems = document.querySelectorAll(".wildfire-item");
  var popup = e.target.getPopup();
  var content = popup.getContent();

  wildfireItems.forEach((item) => item.classList.remove("wildfire-item-border")); //remove the wildfire item border class on every wildfire item
  // loops through wildfire items and compares content text to paragraph text. If there's a match, highlight the wildfire item in the wildfire list container
  for (i = 0; i < wildfireItems.length; i++) {
    if (content == wildfireItems[i].innerText) {
      wildfireItems[i].classList.add("wildfire-item-border");
    }
  }
}

function removeAllChildren(parent) {
  //remove all child elements of a parent container
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild);
  }
}

let selected;
let index = -1;
let searchInput = document.querySelector(".search-input");
let searchItems = document.querySelectorAll(".search-item");

function highlightListItem(e) {
  let len = document.querySelectorAll(".search-item").length - 1;

  // DOWN ARROW
  if (e.key === "ArrowDown") {
    index++;
    if (selected) {
      //if there is a selected item
      removeClass(selected, "highlighted-item"); //remove selected item's class
      next = document.querySelectorAll(".search-item")[index];

      if (typeof next !== undefined && index <= len) {
        //if next element isn't undefined and index is less than the length of the nodelist
        selected = next; //next item is selected
      } else {
        index = 0;
        selected = document.querySelectorAll(".search-item")[0]; //otherwise select first element
      }

      scrollWithHighlightedItem();
      addClass(selected, "highlighted-item"); //add class to selected item
    } else {
      //if not selected
      index = 0;
      selected = document.querySelectorAll(".search-item")[0];
      addClass(selected, "highlighted-item"); //add class to first item
      return;
    }
  }
  // UP ARROW
  else if (e.key === "ArrowUp") {
    if (selected) {
      removeClass(selected, "highlighted-item");
      index--;
      next = document.querySelectorAll(".search-item")[index];

      if (typeof next !== undefined && index >= 0) {
        selected = next;
      } else {
        index = len;
        selected = document.querySelectorAll(".search-item")[len];
      }

      scrollWithHighlightedItem();
      addClass(selected, "highlighted-item");
    } else {
      index = 0;
      selected = document.querySelectorAll(".search-item")[len];
      addClass(selected, "highlighted-item");
    }
  }
}

function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(
      new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"),
      " "
    );
  }
}

function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += " " + className;
  }
}

function scrollWithHighlightedItem() {
  let topOfSelected = selected.getBoundingClientRect().top;
  const topOfContainer = searchResults.getBoundingClientRect().top;
  const bottomOfSelected = selected.getBoundingClientRect().bottom;
  const bottomOfContainer = searchResults.getBoundingClientRect().bottom;

  if (topOfContainer > topOfSelected) {
    //if top of search results is lower than top of selected element
    searchResults.scrollTo(0, 0);
    topOfSelected = selected.getBoundingClientRect().top;
    const selectedPositionTop = topOfSelected - topOfContainer;
    searchResults.scrollTo(0, selectedPositionTop);
  } else if (bottomOfContainer < bottomOfSelected) {
    //if bottom of searchResults is higher than bottom of selected element
    const selectedPositionBottom = bottomOfSelected - bottomOfContainer + 17;
    searchResults.scrollBy(0, selectedPositionBottom);
  }
}

let timer;
async function getSearchData() {
  let searchQuery = "Los Angeles"; //eventually set this to user location
  searchQuery = searchInput.value;
      
  const loader = document.querySelector('.loader')

  async function search(){
    if(wildfireDataLoaded){

      //check if search is complete, if not done yet loading after .25 secs, show loader
      setTimeout(function(){
        if(searchComplete == false){
          loader.classList.add('loader-active')    
          loaderActive = true;
        }  
      }, 250)

      searchComplete = false;
      searchWildfireData(searchQuery); 
      await getMapBoxData(searchQuery); //uses text from search input
      searchComplete = true;

      //if no search results, show no results element
      if (searchResults.children.length == 0) {
        makeSearchItem('noResultsItem');
      }

      loaderActive = false;
      loader.classList.remove('loader-active')
      searchResults.classList.add("active-results");
      searchResults.scrollTo(0, 0);
      index = -1;

    //if nasa api data isn't loaded, show loader, check once a second
    } else if(wildfireDataLoaded == false){
      if(loaderActive == false){
        loader.classList.add('loader-active');
        loaderActive = true;
      }
      setTimeout(search, 1000)
    }
  }
  
  
  clearTimeout(timer); // Clears any outstanding timer
  // Sets new timer that may or may not get cleared, wait .5 secs until executing search
  timer = setTimeout(async function () {
    searchResults.classList.remove("active-results");
    removeAllChildren(searchResults); //remove previous search's results
    if (searchInput.value == "") {
      return;
    }
    await search()
  }, 500);
}


function keyboardAcceptSearchLocation(e){
  searchItems = document.querySelectorAll(".search-item");
   if (e.key == "Enter" && searchItems.length > 0) {
      for (i = 0; i < searchItems.length; i++) {
        if (searchItems[i].classList.contains("highlighted-item")) {
          index = -1;
          return acceptSearchQuery(
            parseFloat(searchItems[i].dataset.lat),
            parseFloat(searchItems[i].dataset.long)
            );
        }
      }
    }
}

searchInput.addEventListener("input", getSearchData);
searchInput.addEventListener("keydown", highlightListItem);
searchInput.addEventListener('keyup', keyboardAcceptSearchLocation)
showAllButton.addEventListener("click", showAllWildfires);

getWildfireData();
getSearchData();