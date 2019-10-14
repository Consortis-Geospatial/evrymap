![Figure 1-1](public/css/images/EVRIMAP_Color_Negative.png "evrymap")

**A nodeJS map portal**

EVRYMAP allows you to create interactive map portals. It's based on [NodeJS](https://nodejs.org/en/), [OpenLayers 4](https://github.com/openlayers/openlayers/releases/tag/v4.6.5) and [MapServer](https://mapserver.org/) (although in theory any other map server -like Geoserver- could be used. That's the theory- not tested
## Installation
(assumes you have node and npm installed)
- Clone or download the project
- Navigate to the installation folder and run: `npm install`
- Now cd to the proxy folder and run: `npm install` Note: this is a copy of the [node.js ArcGIS proxy server](https://github.com/jf990/resource-proxy-node) with minor modifications

## Configuration
(assumes that you have mapserver running on port 80)
The main app configuration is controlled in `$root_folder/config/config.json` which looks like this:
```{
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
}```
Where:
- **configJson** Application-specific configuration file e.g. `layerconfig-sample.json`. 
- **searchaddressmod** The javascript to be used for  _address geocoding_ e.g. `address_nominatim.js` Currently only [Nominatim](https://nominatim.org/release-docs/latest/) is supported
- **loadeditmod**  true ή false (case sensitive) Whether to load the _Editor Module_ (for digitizing/editing layer data)
- **sitetitle** The title that will appear on the header e.g. 'Sample Site'
- **sitelogo** The full image path for the header image e.g. `css/images/EVRIMAP_Color_Negative.png`
- **logotitle**" Alt-title for the image e.g. `"EVRYMAP logo"
- **custommods**" A list of any additional modules to load. **MORE INFO TO FOLLOW**
- **lang** Language in which all controls will appear. Currently only Greek (el-GR) and English (en-US) are supported
- **editConnectionType** Database type. Currently only the values "MSSQL" or "POSTGRES" are supported. Applies only if the loadedit mode value is set to true
- **editConnection** References one of the connection names that are defined in _connections_ list 

```
