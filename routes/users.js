var express = require('express');
var bodyParser = require("body-parser");

var router = express.Router();
const config = require('../config/config.json');
// const config = require('../config/config_sample.json');
const crypto = require('../crypto');

// Check if we are using a C# class library for encryption
var encDllProxy;
if (config.authType.toUpperCase() === "DLL") {
   var edge = require("edge-js");
   encDllProxy = edge.func({
      assemblyFile: config.authDllPath,
      typeName: config.authDllTypeName,
      methodName: config.authDllMethod
   });
}
// Check if a db connection has been defined in the config
// Currently only Postgres and MSSQL connections are supported
var server, dbname, db, options;
if (typeof config.editConnection !== "undefined") {
   var editConnection = config.editConnection;
   var editConnectionType = config.editConnectionType;
   if (editConnectionType === "MSSQL") {
      db = require('mssql');
   } else if (editConnectionType === "POSTGRES") {
      db = require('pg');
   }

   config.connections.forEach(function (con) {
      if (con.name === editConnection) {
         server = con.server;
         dbname = con.db;
         options = con.options;
         return false;
      }
   });
}



/* router.get('/', function(req, res, next) {
 res.send('respond with a resource');
}); */


function login(req, res) {
   var message = '';
   var sess = req.session;

   if (req.method == "POST") {
      var post = req.body;
      var name = post.user;
      var pass = post.password;
      var connectionString;
      if (editConnectionType === "POSTGRES") {
         connectionString = "postgres://" + name + ":" + pass + "@" + server + ":5432/" + dbname;

      } else if (editConnectionType === "MSSQL") {
         connectionString = {
            user: name,
            password: pass,
            server: server, // You can use 'localhost\\instance' to connect to named instance
            database: dbname,
            options: options
         };
         var flatConnectionString = "User Id=" + connectionString.user + ";Password=" + connectionString.password + "; Server=" + connectionString.server + ";Database=" + connectionString.database + ";" + connectionString.options;
         db.connect(flatConnectionString, function (err) {
            if (err) {
               //console.log("Error while connecting database :- " + err);
               res.send(err);
               db.close();
            } else {
               //res.send(connectionString);

               if (typeof encDllProxy !== "undefined") {
                  encDllProxy(flatConnectionString + '|' + config.authKey + '|0', function (error, encString) {
                     addCookie(res, encString, editConnectionType, name);
                     res.send(encString);
                  });
               } else {
                  let encString = crypto.encrypt(flatConnectionString)
                  addCookie(res, encString, editConnectionType, name);
                  res.send(encString);
               }
               db.close();
            }
         });
      }
   } else {
      res.render('index.ejs', {
         message: message
      });
   }
}

function addCookie(res, con, type, username) {
   let evrymap = {
      id: con,
      user: username,
      type: type,
      lastVisit: Date.now()
   };
   res.cookie("evrymap", JSON.stringify(evrymap));

}
module.exports = router;
module.exports.login = login;