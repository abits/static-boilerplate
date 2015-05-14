var express = require('express'),
    morgan  = require('morgan'),
    app     = express();

var port        = parseInt(process.argv[3]),
    livePort    = parseInt(process.argv[4]),
    docRoot     = process.argv[5],
    reload      = process.argv[6];

app.use(morgan('combined'));

if (reload == 'reload') {
  app.use(require('connect-livereload')({port: livePort}));
}

app.use(express.static(__dirname + '/' + docRoot));

app.listen(port);
