var express = require('express'),
  rest = require('restler'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  async = require('async'),
  passport = require('passport'),
  GitHubStrategy = require('passport-github2').Strategy,
  Config = require('./models/config.js'),
  utils = require('./utils/util.js'),
  mongoose = require('mongoose'),
  uuid = require('node-uuid'),
  User = require('./models/user.js'),
  XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
mongoose.connect('mongodb://goelashish7:goelashish7@ds062059.mlab.com:62059/gitauth');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(new GitHubStrategy({
  clientID: 'a27e147b786aaa7c6403',
  clientSecret: 'b44f73535fdd4b92f45774c6c6ea11fa26f852bf',
  callbackURL: 'https://connector-poc.azurewebsites.net/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    var user = new User();
    user.userid = profile.id;
    user.username = profile.username;
    user.displayName = profile.displayName;
    user.accessToken = accessToken;
    done(null, user);
  }));

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

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', function (req, res, next) {
  passport.authenticate('github', {
    scope: ['public_repo'],
    callbackURL: 'https://connector-poc.azurewebsites.net/auth/github/callback',
    display: 'popup'
  })(req, res, next);
});

app.get('/auth/github/callback', function (req, res, next) {
  passport.authenticate('github', {
    successRedirect: '/gitconfig',
    failureRedirect: '/signin',
    callbackURL: 'https://connector-poc.azurewebsites.net/auth/github/callback'
  })(req, res, next);
});

app.get('/signin', function (req, res) {
  renderView(req, res, 'signin.jade');
});

app.get('/config', function (req, res) {
  session = req.session;
  session.webhook_url = req.query.webhook_url;
  session.group_name = req.query.group_name;
  renderView(req, res, 'githubsignin.jade');
});

app.get('/gitconfig', function (req, res) {
  renderView(req, res, 'config.jade', { user: req.user });
});

app.post('/config', function (req, res) {
  var repo_name = req.body.selectpicker;
  var webhook_url = req.session.webhook_url;
  var group_name = req.session.group_name;

  findConfig(group_name, webhook_url, repo_name, function (error, configFound) {
    if (configFound) {
      registerWebhook(configFound, req.user);
    }
  });

  // Generate connector message
  var text = "A connector for " + repo_name + " has been set up";
  var message = { "@type": "MessageCard", "summary": "Task", "themeColor": "0078D7", "sections": [{ "text": text }] };

  // Post to connectors endpoint so they can route the message properly
  rest.postJson(webhook_url, message).on('complete', function (data, response) {
    renderView(req, res, 'close.jade');
  });
});

// app.get('/send', (req, res) => {
//   // Handshake and figure out if we already know about this connector config
//   var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';
//   Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
//     if (err)
//       console.log(err);
//     else
//       sendMessageToGroup(config);
//   });

// });

// app.post('/createtask', (req, res) => {
//   // Handshake and figure out if we already know about this connector config
//   var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';
//   var body = req.body;
//   var creator = body.creator;
//   var desc = body.summary;
//   Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
//     if (err)
//       console.log(err);
//     else
//       createNewTask(config, creator, desc);
//   });

// });

// app.post('/assigntask', (req, res) => {
//   // Handshake and figure out if we already know about this connector config
//   var webhook_url = (typeof req.query.webhook_url === 'string') ? req.query.webhook_url : '';
//   var body = req.body;
//   var creator = body.creator;
//   var desc = body.summary;
//   var assignee = body.assignee;

//   Config.findOne({ 'webhookUrl': webhook_url }, function (err, config) {
//     if (err)
//       console.log(err);
//     else
//       assignTask(config, creator, desc, assignee);
//   });

// });

app.post('/send', (req, res) => {
  console.log(req.body)
  var guid = req.query.id;
  getGitConfiguration(guid, function (error, configFound) {
    if (configFound) {
      var text = "The comments are posted";
      var message = { "@type": "MessageCard", "summary": "Task", "themeColor": "0078D7", "sections": [{ "text": text }] };

      // Post to connectors endpoint so they can route the message properly
      rest.postJson(configFound.webhookUrl, message).on('complete', function (data, response) {
        console.log("merged");
      });
      res.setHeader("CARD-ACTION-STATUS","Your comments are posted succesfully");
      res.sendStatus(200);
    }
  });
  // console.log(req.session.webhook_url);
  // var conf = new Config();
  // conf.webhookUrl = 'https://outlook.office.com/webhook/e8bd9852-fe51-455f-84b0-530c1c27078f@72f988bf-86f1-41af-91ab-2d7cd011db47/IncomingWebhook/cb58b339a17e49bd915f89879fa937b7/fbf02b3a-c006-4373-ba37-9a7143880b44';
  // conf.textChoice = 'bold';
  // assignTask(conf, 'a', 'b', 'c');
  // res.sendStatus(200);
});

app.post('/notify', (req, res) => {
  var guid = req.query.id;
  var payload = req.body;
  if (payload.pull_request) {
    getGitConfiguration(guid, function (error, configFound) {
      if (configFound) {
        sendConnectorCard(configFound, payload);
        res.sendStatus(200);
      }
    });
  }
});

function sendConnectorCard(config, payload) {
  var id = payload.pull_request.id;
  var action = payload.action;
  var title = payload.pull_request.title;
  var user = payload.pull_request.user.login;
  var url = payload.pull_request._links.html.href;
  var repo_name = payload.pull_request.head.repo.full_name;
  var message = utils.createNotificationCard(config.guid, id, action, title, user, url, repo_name);
  rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
    console.log("success");
  });
}

app.get('/close', function (req, res) {
  renderView(req, res, 'close.jade');
});

function renderView(req, res, view, locals) {
  if (locals === undefined) {
    locals = {};
  }
  res.render(view, locals);
}

// function sendMessageToGroup(config) {
//   //Generate connector message
//   var message;
//   if (config.textChoice == "bold")
//     message = utils.generateConnectorCardBold();
//   else
//     message = utils.generateConnectorCard();

//   // Post to connectors endpoint so they can route the message properly
//   rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
//     console.log("success");
//   });
// }

// function createNewTask(config, creator, desc) {
//   //Generate connector message
//   var message;
//   if (config.textChoice == "bold")
//     message = utils.createTaskBold(creator, desc);
//   else
//     message = utils.createTask(creator, desc);

//   // Post to connectors endpoint so they can route the message properly
//   rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
//     console.log("success");
//   });
// }

// function assignTask(config, creator, desc, assignee) {
//   //Generate connector message
//   var message;
//   if (config.textChoice == "bold")
//     message = utils.assignTaskBold(creator, desc, assignee);
//   else
//     message = utils.assignTask(creator, desc, assignee);

//   // Post to connectors endpoint so they can route the message properly
//   rest.postJson(config.webhookUrl, message).on('complete', function (data, response) {
//     console.log("success");
//     return;
//   });
// }

function findConfig(group_name, webhook_url, repo_name, done) {
  var uuidGit = uuid.v1();

  Config.findOne({ 'guid': uuidGit }, function (err, config) {
    if (err)
      return done(err);
    if (config)
      return done(null, config);
    else {
      var config = new Config();
      config.guid = uuidGit;
      config.groupName = group_name;
      config.webhookUrl = webhook_url;
      config.repoName = repo_name;
      config.save(function (err) {
        if (err)
          return done(err);
      });
      return done(null, config);
    }
  });
}

function getGitConfiguration(guid, done) {
  Config.findOne({ 'guid': guid }, function (err, config) {
    if (config)
      return done(null, config);
    else
      return done(err);
  });
}

function registerWebhook(configuration, user) {
  var message =
    {
      "name": "web",
      "active": true,
      "events": [
        "push",
        "pull_request"
      ],
      "config": {
        "url": "https://connector-poc.azurewebsites.net/notify?id=" + configuration.guid,
        "content_type": "json"
      }
    };

  var xmlHttp = new XMLHttpRequest();
  var url = "https://api.github.com/repos/" + user.username + "/" + configuration.repoName + "/" + "hooks";
  var authorization = "Bearer " + user.accessToken;
  xmlHttp.open("POST", url, false);
  xmlHttp.setRequestHeader("Content-type", "application/json");
  xmlHttp.setRequestHeader('Authorization', authorization);
  xmlHttp.send(JSON.stringify(message));
  var result = JSON.parse(xmlHttp.responseText);
  console.log(result);
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