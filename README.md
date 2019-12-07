
**A nodeJS map portal**

  

EVRYMAP allows you to create interactive map portals. It's based on [NodeJS](https://nodejs.org/en/), [OpenLayers 4](https://github.com/openlayers/openlayers/releases/tag/v4.6.5) and [MapServer](https://mapserver.org/) (although in theory any other map server -like Geoserver- could be used. That's the theory- not tested


### Table of Contents  
[Installation](#installation)  
[Application Configuration](#application-configuration)  
[Layer Configuration](#layer-configuration)  
...snip...    

<a name="installation"/>

## Installation

(assumes you have node and npm installed)

- Clone or download the project

- Navigate to the installation folder and run: `npm install`

- Now cd to the proxy folder and run: `npm install` Note: this is a copy of the [node.js ArcGIS proxy server](https://github.com/jf990/resource-proxy-node) with minor modifications

- Before you can run the project you need to rename or save the /config/config_sample.json to config.json

## Run the sample project

- Navigate to the installation folder and run: `npm start` (assumes you already renamed the /config/config_sample.json to config.json)
  
## Application Configuration

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
- **proxyUrl**: The full url for the proxy e.g. `http://localhost:{port_number}/proxy/`,

- **proxyRedirect**: Where the proxy app runs. Usually at port 3692 e.g. `http://localhost:3692`,
- **configJson** The layer configuration file to use e.g. `layerconfig-sample.json`. See [Layer Configuration](#layer-configuration) for more information
- **searchaddressmod** The javascript library to use for address geocoding_ e.g. `address_nominatim.js` Currently, only [Nominatim](https://nominatim.org/release-docs/latest/) is supported
- **loadeditmod**  true ή false (case sensitive) Whether to load the Editor module which allows you to edit layers.
- **sitetitle** The title to display on the site header e.g "Landify Sample Site"
- **sitelogo** Relative  path for the image to display on the top left of the header. `css/images/evrymap-logo.png"` **Note:** The max height for the image must be 50px
- **logotitle**" The image alt-title e.g. "Evrymap logo"
- **custommods**" TBA
- **lang** Default system language π.χ. `"el-GR"`. Currently, only Greek and English resource files are provided.
- **editConnectionType** Database type (currently only "MSSQL" or "POSTGRES" values are supported. Applies only if loadeditmod is set to true
- **editConnection** The database connection to use. Should be one of the connection objects defined in the  `"connections"` list e.g. "`SampleConnection"`

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


## Layer Configuration
TODO

> Written with [StackEdit](https://stackedit.io/).
