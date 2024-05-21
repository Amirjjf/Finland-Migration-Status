
let Positive_mapDataMap = new Map();
let Negative_mapDataMap = new Map();


async function fetchdata() {
    const response = await fetch('https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326');
    const data = await response.json();
    initMap(data);
}

async function fetchPositiveData() {
    const response = await fetch('https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f');
    const data = await response.json();
    processPositiveMigrationData(data);
}

async function fetchNegativeData() {
    const response = await fetch("https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e")
    const data = await response.json();
    processNegativeMigrationData(data);
}

function processPositiveMigrationData(data) {
    const areas = data.dataset.dimension.Tuloalue.category.label;
    const values = data.dataset.value;
    let i = 0;
    for (let area in areas) {
        const towns = areas[area];
        Positive_mapDataMap.set(towns, values[i]);
        //municipalities.push(towns);
        //arrival_values.push(values[i]);
        i++;
    }
    //console.log(municipalities);
    //console.log(arrival_values);
}

function processNegativeMigrationData(data){
    const areas = data.dataset.dimension.Lähtöalue.category.label;
    const values = data.dataset.value;
    let i = 0;
    for (let area in areas) {
        const towns = areas[area];
        Negative_mapDataMap.set(towns, values[i]);
        i++;
    }
    //console.log(Negative_mapDataMap);
}




function initMap(data) {
    var map = L.map('map', {
        minZoom: -3,
    });
    let geojson = L.geoJson(data, {
        weight: 2,
        style: function(feature) {
            const townName = feature.properties.name;
            const posMigrationData = Positive_mapDataMap.get(`Arrival - ${townName}`);
            const negMigrationData = Negative_mapDataMap.get(`Departure - ${townName}`);
            const hue = computeHue(posMigrationData || 0, negMigrationData || 0);  
            const hslColor = `hsl(${hue}, 75%, 50%)`;
            return {
                fillColor: `hsl(${hue}, 75%, 50%)`,
                fillOpacity: 0.4,  
                color: hslColor,  // Border color
                weight: 2  // Border weight
            };
        },
        onEachFeature: clickMunicipality
    }).addTo(map);
    
    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    map.fitBounds(geojson.getBounds());
}



function clickMunicipality(feature, layer) {
    if (feature.properties && feature.properties.name) {  
        const arrival_key = `Arrival - ${feature.properties.name}`;
        const departure_key = `Departure - ${feature.properties.name}`;
        const posMigrationData = Positive_mapDataMap.get(arrival_key);
        const negMigrationData = Negative_mapDataMap.get(departure_key);
        const tooltipContent = `${feature.properties.name}`;
        const popupContent = `Positive Migration: ${posMigrationData || 'Data not available'} <br>Negative Migration: ${negMigrationData || 'Data not available'}`;

        layer.bindTooltip(tooltipContent);
        layer.on('click', function () {
            layer.bindPopup(popupContent).openPopup();
        });
    }
}

function computeHue(posMigration, negMigration) {
    if (negMigration === 0) {
        return 120;  
    }
    let hue = Math.pow((posMigration / negMigration), 3) * 60;
    return Math.min(hue, 120);
}





async function startProgram() {
    try {
        await Promise.all([fetchPositiveData(), fetchNegativeData()]);
        await fetchdata();
    } catch (error) {
        console.error('Data fetching or map initialization failed:', error);
    }
}

startProgram();








