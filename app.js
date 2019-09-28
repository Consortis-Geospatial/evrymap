var createError = require('http-errors');
var express = require('express');
var bodyParser = require('body-parser');
//var upload = require('jquery-file-upload-middleware');

var fileUpload = require('express-fileupload');


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const proxy = require('http-proxy-middleware');

dotenv.config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var cors = require('cors');

var app = express();
app.use(fileUpload());

// configure upload middleware
/* upload.configure({
  uploadDir: __dirname + '/public/uploads',
  uploadUrl: '/uploads',
  imageVersions: {
    thumbnail: {
      width: 80,
      height: 80
    }
  } 
});*/

// sets port 8080 to default or unless otherwise specified in the environment
app.set('port', process.env.PORT || 8080);

//Read config
// config variables
const config = require('./config/config.json');

// Static files
//const public = require('./public');
// as a best practice
// all global variables should be referenced via global. syntax
// and their names should always begin with g
global.gConfig = config;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.post('/login', function (req, res) {
  //console.log('login');
  usersRouter.login(req, res);
});
var cookieParser = require('cookie-parser');
app.use(cookieParser());
// Add middleware for http proxying 
// This will redirect any /node requests to the the proxy app
const apiProxy = proxy('/proxy', {
  target: gConfig.proxyRedirect
});
app.use('/proxy', apiProxy);
app.post('/upload', function (req, res) {
  let upFolder = req.body.folder;
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // This assumes that the name of the input field is always called "files[]"
  let file2Upload = req.files["files[]"];

  // Use the mv() method to place the file somewhere on your server appending the timestamp
  let timestamp = new Date().getTime().toString();
  let uplFileName=file2Upload.name.split('.')[0]+'_' + timestamp + '.' +  file2Upload.name.split('.')[1];
  file2Upload.mv(upFolder + '/' + uplFileName, function (err) {
    if (err)
      return res.status(500).send(err);
    // Return the time-stamped filename
    res.send(uplFileName);
  });
});
app.use(bodyParser());
// Check for any nodejs custom modules and load them. They should all exist in the ./modules folder
var modVars = {};
gConfig.custommods.forEach(function (mod) {
  if (mod.isNodeModule) {
    var modName = mod.name;
    modVars[modName] = require('./modules/' + mod.name + '/' + mod.name)(app);
  }
});

// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  next(createError(404));
});*/

// error handler
/* app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}); */
// Expose app
exports = module.exports = app;

//console.log(`Your port is ${process.env.PORT}`); // 8626