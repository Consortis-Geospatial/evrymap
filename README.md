
  

**A nodeJS map portal**

  

  

EVRYMAP allows you to create interactive map portals. It's based on [NodeJS](https://nodejs.org/en/), [OpenLayers 4](https://github.com/openlayers/openlayers/releases/tag/v4.6.5) and [MapServer](https://mapserver.org/) (although in theory any other map server -like Geoserver- could be used. That's the theory- not tested

  [[TOC]]
  
  

### Table of Contents

[Installation](#installation)

[Application Configuration](#application-configuration)

[Layer Configuration](#layer-and-map-configuration)
- [Map Object](#map-object)
- [Layer array](#layer-array)
--[Supported Layer Types](#supported-layer-types)
-- [Bing Layers](#bing-layers)
-- [OSM Layers](#osm-layers)
-- [WMS Layers](#bing-layers)




...snip...

  

<a  name="installation"/>

  

# Installation
(assumes you have node and npm installed)
- Clone or download the project
- Navigate to the installation folder and run: `npm install`
- Now cd to the proxy folder and run: `npm install` Note: this is a copy of the [node.js ArcGIS proxy server](https://github.com/jf990/resource-proxy-node) with minor modifications

- **NOTE:** Before you can run the project you need to **rename or save** the /config/config_sample.json to **config.json**

  

# Run the sample project
- Navigate to the installation folder and run: `npm start` (assumes you already renamed the /config/config_sample.json to config.json)

# Application Configuration

(assumes that you have mapserver running on port 80)

By default, the application will run on port 3000. You can change this by adding the .env file and setting a different port e.g.

```
# .env

NODE_ENV=development

PORT=8181
```

The main app configuration is controlled in `$root_folder/config/config.json` which looks like this:


```

{
"proxyUrl": "http://localhost:3000/proxy/",
"proxyRedirect": "http://localhost:3692",
"configJson":"layerconfig-sample.json",
"searchaddressmod" :"address_nominatim.js",
"loadeditmod": true,
"sitetitle":"| Sample Site",
"logotitle" :"EVRYMAP logo",
"sitelogo":"css/images/EVRIMAP_Color_Negative.png",
"lang" :"en-US",
"editConnectionType" :"<MSSQL or POSTGRES>",
"editConnection":"<Connection name as defined in the 'connections' object below",
"authType": "<NodeJS or DLL>",
"authDllPath" :"<path to the DLL file>",
"authDllTypeName" :"<DLL namespace e.g. Consortis.CryptoAsync.EncryptDecrypt>",
"authDllMethod" : "Encyrption/Decryption method e.g.EncDec",
"authKey":"<MD5 key>",
"custommods":[
			],
"connections": [
	{
	"name": "SampleConnection",
	"server": "<server_name>",
	"db": "<database name>",
	"options":"<database specific options>"
	}
]
}
```  
where:

-  **proxyUrl**: The full url for the proxy e.g. `http://localhost:{port_number}/proxy/`,

  

-  **proxyRedirect**: Where the proxy app runs. Usually at port 3692 e.g. `http://localhost:3692`,

-  **configJson** The layer configuration file to use e.g. `layerconfig-sample.json`. See [Layer Configuration](#layer-configuration) for more information

-  **searchaddressmod** The javascript library to use for address geocoding_ e.g. `address_nominatim.js` Currently, only [Nominatim](https://nominatim.org/release-docs/latest/) is supported

-  **loadeditmod** true ή false (case sensitive) Whether to load the Editor module which allows you to edit layers.

-  **sitetitle** The title to display on the site header e.g "Landify Sample Site"

-  **sitelogo** Relative path for the image to display on the top left of the header. `css/images/evrymap-logo.png"`  **Note:** The max height for the image must be 50px

-  **logotitle**" The image alt-title e.g. "Evrymap logo"

-  **custommods**" TBA

-  **lang** Default system language π.χ. `"el-GR"`. Currently, only Greek and English resource files are provided.

-  **editConnectionType** Database type (currently only "MSSQL" or "POSTGRES") values are supported. Applies only if loadeditmod is set to true

-  **editConnection** The database connection to use. Should be one of the connection objects defined in the `"connections"` list e.g. "`SampleConnection"`
```
"connections": [
	{
	"name": "SampleConnection",
	"server": "<server_name>",
	"db": "<database name>",
	"options":"<database specific options>"
	}
]
```
# Layer and map Configuration
The layers and map settings are configured in the *-config.json file, located under 
The * -config.json file consists of four main objects:

- Map object
- Array of "layer" objects
- Search object
-  Layout object (WIP)


## Map object
Below is an example. 

    "map": {
        "mapserver": "192.168.0.204",
        "mapservexe": "mapserver/mapserv",
        "mcenter": "457061, 4431153",
        "projcode": "EPSG:2100",
        "projdescr": "+title=GGRS87 / Greek Grid +proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs",
        "mapextent": "-493435.77,4040104.80,1428776.09,5164248.00",,
        "xyzoomlevel": "10",
        "initzoomlevel": 10,
        },

Where:

- **mapserver** - Mandatory. The root url where the mapserver is installed (e.g. 192.168.0.33)
- **mapservexe** - Mandatory if useWrappedMS is set to false. Contains the string for the rest of the mapserver URL 
- **useWrappedMS** Optional. Boolean. If set to true, then the "mapserver" option will be expected to contain the full mapserver url including the mapfile. Useful when the webserver mapserver have rewrite rules to 'hide' the path to the mapfile (for example, instead of `cgi-bin/mapserv?map=/home/www/mapserverstuff/mymapfile.map&mode=map` rewrite to:  `wmsmap?mode=map`For more details see https://mapserver.org/ogc/wms_server.html#changing-the-online-resource-url

- **mcenter** - Mandatory. The center (x, y) of the map that will appear
- **projcode** : Mandatory. The EPSG code 
- **projdescr** : Mandatory. Defines the map projection system in Well-known text (WKT). Needed because Openlayers does not contain all of the codes
- **mapextent** : Mandatory. Should be set to the projection extent
- **xyzoomlevel** - Optional. The zoom level when zooming to a point feature.  Defaults to "13" if not defined.
- **initzoomlevel** - Optional. The initial zoom level for the map. Defaults to "2" if not defined.

## Layer array
The layer array is in the following form
```
layers: [
     {layer1},
     {layer2},
     ....
]
```
### Supported Layer Types
5 layer types are currently supported
- Bing
- OSM
- WMS
- WFS
- ESRI Rest Map Services

Depending on their type they may have different properties.
### Bing layers
Example:

```
{
      "name": "Bing",
      "type": "Bing",
      "label": "Bing Maps",
      "display_on_startup": true,
      "bing_key": "{your_bing_key from http://www.bingmapsportal.com/ }",
      "bing_style": "AerialWithLabels"
      "group" : "Background Maps"
}
```
#### Properties
- **name** - Mandatory. Layer name.  ****Note: No special characters or spaces are allowed ****
- **type** - Bing. Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.  If missing the "name" value will be used. 
- **display_on_startup**: Boolean. Whether the layer will be visible on startup
- **group**: Optional. The group name to add the layer in
- **bing_key**: Mandatory. You can register for a key at http://www.bingmapsportal.com/ 
- **bing_style**: Mandatory. One of Aerial|AerialWithLabels|Road|RoadOnDemand
### OSM layers
Example:
```
{
  "name": "OSM",
  "type": "OSM",
  "label": "Χάρτης OSM",
  "url": "http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "display_on_startup": true
},
```
#### Properties
- **name** - Mandatory. Layer name.  ****Note: No special characters or spaces are allowed ****
- **type** - OSM. Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.  If missing the "name" value will be used. 
- **display_on_startup**: Boolean. Whether the layer will be visible on startup
-  **group**: Optional. The group name to add the layer in
- **url** - Mandatory. The OSM url to use. See also [OSM Styles](http://blog.programster.org/openlayers-3-using-different-osm-tiles)

### WMS layers
Example of basic settings for a WMS Layer:

    {
    "name": "kallikratis",
    "type": "WMS",
    "projection": "EPSG:2100",
    "mapfile": "<path_to_mapfile>\sample.map",
    "label": "Municipal Boundaries",
    "display_on_startup": true,
    "queryable": true,
    "search_fields": "NAME:Municipal Unit Name",
    "identify_fields": "NAME:Municipal Unit Name",
    "group": "Admin Boundaries"
    }
#### Properties
- **name** - Mandatory. Layer name.  ****Note: No special characters or spaces are allowed ****
- **type** - "WMS" Mandatory.
- **tiled**: Optional. Boolean. If omitted, sets to false. For WMTS layers.
- **label** - Optional. Layer name as it will appear in the legend.  If missing the "name" value will be used. 
- **display_on_startup**: Boolean. Whether the layer will be visible on startup
- **group**: Optional. The group name to add the layer in
- **projection** : Optional. Required only if the layer is NOT in EPS:3857 or EPSG:4326 projections (which are included by default in OL). **IMPORTANT NOTE** If you set a projection then you will need to define the projection information in the `$root_folder/public/config/projdef.json` See also [The projdef.json file](#the-projdef.json-file)
-  **queryable** : Optional. Boolean. If set to true, layer will be queryable using the identify, select by rectangle tools and will appear in the results of simple and advanced search.
-  **exportable** : Optional. Boolean. If set to true, a dropdown menu will display next to the layer name with the options to export to a shapefile or CSV. **NOTE: The layer should also support WFS requests for this to work**
- **search_fields** : Mandatory if the queryable property is set to true. The list of fields on the layer to search on separated by commas in the format:
`{field1}:{alias1}{field2}:{alias2},...`
- **identify_fields** : Mandatory if the queryable property is set to true. The list of fields on the layer that will appear in the search results dialog (after using identify, select by recangle, simple and advanced search), separated by commas in the format:
`{field1}:{alias1}{field2}:{alias2},...`
- **relation**: JSON object. Optional. Creating a relation object will display a child grid in the search results table that will bring any related records for the current parent record.
**Example**

`

    "relation": {
        "local_field": "kadik",
        "get_related_fn": "getParcelForBuilding",
        "edit_related_fn": "getParcelForBuilding",
        "service_url": "http://192.168.0.204/pb_lrm_service/lrm_crud.asmx"
      }
- **Relation object properties**
   - **local_field**: Required. The field name used as the foreign key for the related record
   - **service_url**: Required. The URL for the service that will get the related records 
   - **get_related_fn**: Required. The JS function that calls the service e.g. `function  getParcelForBuilding(pk, service_url, edit_mode) {..}`
   - **edit_related_fn**: Required. The JS function that calls the service when in edit mode
 - **custom_record_action**: JSON object. Optional. Creating a custom_record_action object will display a [Details] button in the search results table, next to the [Zoom To] button. The button's click event will fire the action as defined in the 
 `
    "custom_record_action": {
        "tooltip": "Details...",
        "action": "lrmForm.lrmShowBuildingDetails",
        "glyphicon": "glyphicon-list-alt"
        }`
- **custom_record_action object properties**
   - **tooltip**: Required. The generated button's tooltip
   - **action**: Required. The JS function to call on the button's click event
   - **glyphicon**: Required. Button's glyphicon
 
 ### WFS layers
 **NOTE:** Only WFS layer returning GeoJSON data are currently supported
 WFS layers have the same properties as the WMS ones (except for "type" and "tiled"), plus some additional:
 
  - **type**: Required. Should always be set to "GeoJSON"
 - **legend_image**: Optional. Sets the image for the layer that will appear in the legend 
- **legend_wh**: The legend symbol's width and height in **pixels** in the form width:height
- **color**: The color to draw the vector features with in html notation e.g. `"#5168b8"`
- **linewidth**: Line width in pixels 
 **allowHover**: Optional. If set to true, hovering the mouse over the feature will display the field names and values as defined in the "identify_fields" property. *TODO: Define a hover_fields property*
 
## Layout object
Work in progress. Specifies how the map will be set up and what tools and toolbars will be available. Useful when the map is inside an iframe in the main container application. This object is not mandatory and can be completely omitted.

    "layout": {
        "header": true,
        "navigation": true,
        "quicksearch": true,
        "print": true
      }

So far, the supported properties are:

- **header** - true / false. Whether the title bar appears.
- **navigation** - true / false. Whether to show the left toolbar with the navigation buttons (zoom in / out etc)
- **quicksearch** - true / false. Whether the search box will appear at the top right
- **print** - true / false. Whether the print button appears

## The projdef.json file
This file contains the projection definition in proj4js format for any layer SRIDs used in the map and are not EPSG:4326 or EPSG:3857 in the format:

    "EPSG:{code}": {proj4js_definition_string}

 The following example is for the Greek Grid (EPSG:2100):

    {
        "EPSG:2100":"+title=GGRS87 / Greek Grid +proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs"
    }
   You can find the proj4js format for other SRIDs in https://spatialreference.org/

> Written with [StackEdit](https://stackedit.io/).
