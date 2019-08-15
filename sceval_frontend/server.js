'use strict';
const express = require('express'),
  fs = require('fs'),
  mustache = require('mustache'),
  port = process.env.PORT || 8080,
  app = express();

const DIST_PATH = __dirname + '/build';
app.use(express.static(DIST_PATH));

const appConfig = require('./app_config');

app.engine('mustache', function (filePath, options, callback) { // define the template engine
  fs.readFile(filePath, function (err, content) {
    if (err) {
      return callback(new Error(err));
    }
    // this is an extremely simple template engine
    const rendered = mustache.render(content.toString(), options);
    return callback(null, rendered);
  });
});
app.set('view engine', 'mustache');

function getMainFile(fileType) {
  let mainFilename = null;
  fs.readdirSync(DIST_PATH + '/static/' + fileType).forEach(file => {
    if (mainFilename === null) {
      if (file.endsWith('.' + fileType)) {
        mainFilename = file;
      }
    }
  });
  return mainFilename;
}

const jsMainFilename = getMainFile('js');
const cssMainFilename = getMainFile('css');

app.get('*', function(request, response) {
  response.render('index', {
    appConfig: JSON.stringify(appConfig),
    jsMainFilename: jsMainFilename,
    cssMainFilename: cssMainFilename
  });
});

app.listen(port);
console.log("server started on port " + port);
