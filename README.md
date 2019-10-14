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


