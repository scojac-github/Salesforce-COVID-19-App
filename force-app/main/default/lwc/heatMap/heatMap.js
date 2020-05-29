import { LightningElement, wire } from 'lwc';
import leafletJS from '@salesforce/resourceUrl/leafletJS';
import jsonData from '@salesforce/resourceUrl/stateData';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import getCovidStates from '@salesforce/apex/heatMapStream.getCovidStateMap';
import stateData from '@salesforce/resourceUrl/stateData';

export default class heatMap extends LightningElement {

    states;
    error;
    
    renderedCallback() {
        console.log('render callback');
    

    Promise.all([
        getCovidStates().then(results => {this.states = results}),
        loadScript(this, leafletJS + '/leaflet.js'),
        loadStyle(this, leafletJS + '/leaflet.css')

    ])

    .then(() => {
        console.log('promise return succesffuly');
        this.initLeaflet();
    })
    .catch(error => {
        console.log('promise return failed' + error);
    }); 

    
}

    initLeaflet(){
        console.log('init loaded');
        const heatMap = this.template.querySelector(".map-root");
        var geojson;
        var info = L.control();
        var legend = L.control({position: 'bottomright'});

        var mymap = L.map(heatMap).setView([37.8, -96], 4);

        ///////// Information Div at Top Right

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };
        
        // method that we will use to update the control based on feature properties passed
        info.update = function (props) {
            this._div.innerHTML = '<h4>US COVID Deaths by State</h4>' +  (props ?
                '<b>' + props.name + '</b><br />' + props.density + ' Deaths'
                : 'Hover over a state');
        };

        info.addTo(mymap);
        
        ///////// Information Div at Top Right

        ///////// Legend Div at Bottom Right

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 100, 500, 1000, 2500, 5000, 10000, 20000],
                labels = [];
        
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }
        
            return div;
        };
        
        legend.addTo(mymap);


        ///////// Lgend Div at Bottom Right

        


        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1, 
    accessToken: 'pk.eyJ1Ijoic2NvamFjIiwiYSI6ImNrYTh5M3QyZDAxNnEyeHA3ZG1hNmZ3anUifQ.bpI403Qd3K9POcfCrqk5GQ'
}).addTo(mymap);

        let request = new XMLHttpRequest();
        request.open("GET", jsonData, false);
        request.send(null);
        let statesDataJson = JSON.parse(request.responseText);
        console.log(statesDataJson);

        for (const statesData of statesDataJson.features){
            let state = this.states[statesData.properties.name];
            if (state){
                statesData.properties.density = state.Deaths__c;
            }            
        }     
        
      geojson = L.geoJson(statesDataJson, { style: style, onEachFeature: onEachFeature }).addTo(mymap);



        function getColor(d) {
            return d > 20000 ? '#800026' :
                   d > 10000 ? '#BD0026' :
                   d > 5000  ? '#E31A1C' :
                   d > 2500 ? '#FC4E2A' :
                   d > 1000   ? '#FD8D3C' :
                   d > 500   ? '#FEB24C' :
                   d > 100   ? '#FED976' :
                              '#FFEDA0';
        }

        function style(feature) {
            return {
                fillColor: getColor(feature.properties.density),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }

        function highlightFeature(e) {
            var layer = e.target;
        
            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });
        
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            info.update(layer.feature.properties);
        }

        function resetHighlight(e) {
            geojson.resetStyle(e.target);
            info.update();
        }

        function zoomToFeature(e) {
            mymap.fitBounds(e.target.getBounds());
        }

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }
    }
    
}