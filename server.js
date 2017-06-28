var express = require('express'),
  rest = require('restler'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  async = require('async'),
  Config = require('./models/config.js');
utils = require('./utils/util.js');
mongoose = require('mongoose');

mongoose.connect('mongodb://goelashish7:goelashish7@ds062059.mlab.com:62059/gitauth');

var app = express();
var webhook_url;
var group_name;
var session;
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'Ashish rocks!',
  saveUninitialized: true,
  resave: true
}));

app.get('/signin', function (req, res) {
  renderView(req, res, 'signin.jade');
});

app.get('/config', function (req, res) {
  session = req.session;
  session.webhook_url = req.query.webhook_url;
  session.group_name = req.query.group_name;
  renderView(req, res, 'config.jade');
});

app.post('/config', function (req, res) {
  var choice = req.body.selectpicker;
  var webhook_url = req.session.webhook_url;
  var group_name = req.session.group_name;
  addOrUpdateGroupConfig(group_name, webhook_url, choice);

  // Generate connector message
  var text = "Welcome to the Connector Tutorial, You are able to see the configured text";

  if (choice == "bold")
    text = "**" + text + "**";

  var message = { "@type": "MessageCard", "summary": "Task", "themeColor": "0078D7", "sections": [{ "text": text }] };

  // Post to connectors endpoint so they can route the message properly
  rest.postJson(webhook_url, message).on('complete', function (data, response) {
    renderView(req, res, 'close.jade');
  });

});

app.get('/send', (req, res) => {

  // Handshake and figure out if we already know about this connector config
  var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';

  Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
    if (err)
      console.log(err);
    else
      sendMessageToGroup(config);
  });

});

app.post('/createtask', (req, res) => {
  // Handshake and figure out if we already know about this connector config
  var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';
  var body = req.body;
  var creator = body.creator;
  var desc = body.summary;
  Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
    if (err)
      console.log(err);
    else
      createNewTask(config,creator,desc);
  });

});

app.post('/assigntask', (req, res) => {
  // Handshake and figure out if we already know about this connector config
  var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';
  var body = req.body;
  var creator = body.creator;
  var desc = body.summary;
  var assignee = body.assignee;

  Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
    if (err)
      console.log(err);
    else
      assignTask(config,creator,desc,assignee);
  });

});

app.post('/send', (req, res) => {
    var conf = new Config();
    config.webhookUrl = 'https://outlook.office.com/webhook/e8bd9852-fe51-455f-84b0-530c1c27078f@72f988bf-86f1-41af-91ab-2d7cd011db47/96fd3531-952c-4bb1-bfaf-926e8e42f193/633a71fe164b4b0ba1fedba97887ce2e/fbf02b3a-c006-4373-ba37-9a7143880b44';
    config.textChoice = 'bold';
        assignTask(config,'a','b','c');
    });

app.get('/close', function (req, res) {
  renderView(req, res, 'close.jade');
});

function renderView(req, res, view, locals) {
  if (locals === undefined) {
    locals = {};
  }
  res.render(view, locals);
}

function sendMessageToGroup(config) {
  //Generate connector message
  var message;
  if (config.textChoice == "bold")
    message = utils.generateConnectorCardBold();
  else
    message = utils.generateConnectorCard();

  // Post to connectors endpoint so they can route the message properly
  rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
    console.log("success");
  });
}

function createNewTask(config,creator,desc) {
  //Generate connector message
  var message;
  if (config.textChoice == "bold")
    message = utils.createTaskBold(creator,desc);
  else
    message = utils.createTask(creator,desc);

  // Post to connectors endpoint so they can route the message properly
  rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
    console.log("success");
  });
}

function assignTask(config,creator,desc,assignee) {
  //Generate connector message
  var message;
  if (config.textChoice == "bold")
    message = utils.assignTaskBold(creator,desc,assignee);
  else
    message = utils.assignTask(creator,desc,assignee);

  // Post to connectors endpoint so they can route the message properly
  rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
    console.log("success");
    return;
  });
}
function addOrUpdateGroupConfig(group_name, webhook_url, choice, done) {
  Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
    if (err) {
      return done(err);
    }
    if (!config) {
      var config = new Config();
      config.groupName = group_name;
      config.webhookUrl = webhook_url;
      config.textChoice = choice;
    }
    else {
      config.textChoice = choice;
    }
    config.save(function (err) {
      if (err) {
        return done(err);
      }
      return config;
    });
  });
}

function getConfig(group_name, done) {
  Config.findOne({ 'groupName': group_name }, function (err, config) {
    if (err) {
      done(err);
    }
    else
      done(null, config);
  });
}

var port = process.env.port || 3998;
app.listen(port, function () {
  console.log('Listening on http://localhost:' + port);
});