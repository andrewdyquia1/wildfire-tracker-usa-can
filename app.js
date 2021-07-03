var mymap = L.map('mapid').setView([34.0522, -118.2437], 9)
L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>',
    maxZoom: 13
}).addTo(mymap);
const regex = RegExp('California');
const wildfireList = document.querySelector('#wildfire-list');
let wildfireItems
let markerArr = []

async function getData(){
//fetches wildfire data from nasa in json
    const response = await fetch('https://eonet.sci.gsfc.nasa.gov/api/v2.1/categories/8');
    const data = await response.json();
    const wildfireEvents = data.events

    for(i = 0; i < data.events.length; i++){
    const wildfireEventsXCoordinate = data.events[i].geometries[0].coordinates[1]
    const wildfireEventsYCoordinate = data.events[i].geometries[0].coordinates[0]

        if(true) {
            //this belongs in the if statement
            //regex.test(wildfireEvents[i].title) && wildfireEventsXCoordinate < 35
            var marker = new L.marker([wildfireEventsXCoordinate, wildfireEventsYCoordinate]).addTo(mymap);
            marker.bindPopup(wildfireEvents[i].title)
            marker.on('click', highlightSelectedWildfireItem);
            markerArr.push(marker)
            createElements(wildfireEvents[i].title, i + 1);

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

                if(this.innerText == wildfirePopups){
                    mymap.setView([chosenWildfireLat, chosenWildfireLng], 13)
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



getData()
//refreshes page every hour
setInterval(function(){ location.reload()}, 3600000)    