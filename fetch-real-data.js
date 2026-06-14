import fs from 'fs';
import path from 'path';

const csvPath = 'D:/2025/user/Aicode/freelandfinder/georgia_low_cost_land_opportunities_enriched.csv';
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');
const headers = lines[0].split(',');

function getEmptyRow() {
    return new Array(headers.length).fill('');
}

async function fetchArcGIS(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
}

async function fetchFulton() {
    console.log('Fetching Fulton parcels...');
    const url = 'https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,ParcelID,TaxYear,Address,Owner,LandAcres,ClassCode,LUCode,AppraisedValue&returnGeometry=true&outSR=4326&f=json&resultRecordCount=300';
    const data = await fetchArcGIS(url);
    const rows = [];
    for (const feature of data.features || []) {
        const attr = feature.attributes;
        const geom = feature.geometry;
        let lat = '', lon = '';
        if (geom && geom.rings && geom.rings[0] && geom.rings[0][0]) {
            lon = geom.rings[0][0][0];
            lat = geom.rings[0][0][1];
        }
        
        const row = getEmptyRow();
        row[headers.indexOf('Listing_ID')] = `FULTON-${attr.OBJECTID}`;
        row[headers.indexOf('Property_Name_or_Address')] = attr.Address ? `"${attr.Address.replace(/"/g, '""')}"` : 'Unknown Address';
        row[headers.indexOf('County')] = 'Fulton';
        row[headers.indexOf('State')] = 'GA';
        row[headers.indexOf('Parcel_ID')] = attr.ParcelID || '';
        row[headers.indexOf('Latitude')] = lat;
        row[headers.indexOf('Longitude')] = lon;
        row[headers.indexOf('Lot_Size_Acres')] = attr.LandAcres || '';
        row[headers.indexOf('Estimated_Price_or_Min_Bid')] = attr.AppraisedValue || '';
        row[headers.indexOf('Current_Status')] = 'Off-Market';
        row[headers.indexOf('Data_Source_Type')] = 'GIS-Parcel';
        row[headers.indexOf('Data_Confidence_0_to_100')] = '92';
        rows.push(row.join(','));
    }
    return rows;
}

async function fetchDeKalb() {
    console.log('Fetching DeKalb parcels...');
    const url = 'https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Tax_Parcels_2025/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,ParcelID,StatedArea,ZONING,LANDUSE,TAXYR,APPRAISED_VALUE&returnGeometry=true&outSR=4326&f=json&resultRecordCount=300';
    const data = await fetchArcGIS(url);
    const rows = [];
    for (const feature of data.features || []) {
        const attr = feature.attributes;
        const geom = feature.geometry;
        let lat = '', lon = '';
        if (geom && geom.rings && geom.rings[0] && geom.rings[0][0]) {
            lon = geom.rings[0][0][0];
            lat = geom.rings[0][0][1];
        }
        
        const row = getEmptyRow();
        row[headers.indexOf('Listing_ID')] = `DEKALB-${attr.OBJECTID}`;
        row[headers.indexOf('Property_Name_or_Address')] = `Parcel ${attr.ParcelID}`;
        row[headers.indexOf('County')] = 'DeKalb';
        row[headers.indexOf('State')] = 'GA';
        row[headers.indexOf('Parcel_ID')] = attr.ParcelID || '';
        row[headers.indexOf('Latitude')] = lat;
        row[headers.indexOf('Longitude')] = lon;
        row[headers.indexOf('Lot_Size_Acres')] = attr.StatedArea || '';
        row[headers.indexOf('Estimated_Price_or_Min_Bid')] = attr.APPRAISED_VALUE || '';
        row[headers.indexOf('Zoning')] = attr.ZONING || '';
        row[headers.indexOf('Current_Status')] = 'Off-Market';
        row[headers.indexOf('Data_Source_Type')] = 'GIS-Parcel';
        row[headers.indexOf('Data_Confidence_0_to_100')] = '92';
        rows.push(row.join(','));
    }
    return rows;
}

async function fetchWare() {
    console.log('Fetching Ware parcels...');
    const url = 'https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer/38/query?where=1%3D1&outFields=OBJECTID,PARCEL,ACRES,HOUSE_NO,STREET_NAM&returnGeometry=true&outSR=4326&f=json&resultRecordCount=300';
    const data = await fetchArcGIS(url);
    const rows = [];
    for (const feature of data.features || []) {
        const attr = feature.attributes;
        const geom = feature.geometry;
        let lat = '', lon = '';
        if (geom && geom.rings && geom.rings[0] && geom.rings[0][0]) {
            lon = geom.rings[0][0][0];
            lat = geom.rings[0][0][1];
        }
        
        let address = 'Unknown Address';
        if (attr.HOUSE_NO || attr.STREET_NAM) {
            address = `"${attr.HOUSE_NO || ''} ${attr.STREET_NAM || ''}".trim()`;
        }
        
        const row = getEmptyRow();
        row[headers.indexOf('Listing_ID')] = `WARE-${attr.OBJECTID}`;
        row[headers.indexOf('Property_Name_or_Address')] = address;
        row[headers.indexOf('County')] = 'Ware';
        row[headers.indexOf('State')] = 'GA';
        row[headers.indexOf('Parcel_ID')] = attr.PARCEL || '';
        row[headers.indexOf('Latitude')] = lat;
        row[headers.indexOf('Longitude')] = lon;
        row[headers.indexOf('Lot_Size_Acres')] = attr.ACRES || '';
        row[headers.indexOf('Current_Status')] = 'Off-Market';
        row[headers.indexOf('Data_Source_Type')] = 'GIS-Parcel';
        row[headers.indexOf('Data_Confidence_0_to_100')] = '93';
        rows.push(row.join(','));
    }
    return rows;
}

async function main() {
    try {
        const fultonRows = await fetchFulton();
        const dekalbRows = await fetchDeKalb();
        const wareRows = await fetchWare();
        
        const allNewRows = [...fultonRows, ...dekalbRows, ...wareRows];
        console.log(`Fetched ${allNewRows.length} total real records.`);
        
        const finalCsvContent = lines.filter(l => l.trim().length > 0).concat(allNewRows).join('\n');
        fs.writeFileSync(csvPath, finalCsvContent);
        console.log('Successfully appended real data to CSV.');
    } catch (e) {
        console.error('Error fetching real data:', e);
    }
}

main();
