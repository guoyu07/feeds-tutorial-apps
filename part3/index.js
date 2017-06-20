const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const Feeds = require("pusher-feeds-server").Feeds;

const feeds = new Feeds({
  serviceId: "YOUR_SERVICE_ID_HERE",
  serviceKey: 'YOUR_SERVICE_KEY_HERE',
  cluster: "api-ceres.pusherplatform.io"
});

const app = express();
app.use(express.static("static"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'SOME-SECRET' }));
app.set('views', './views');
app.set('view engine', 'ejs');

app.get("/login", (req, res) => {
  req.session.userId = req.query.user_id;
  res.redirect(`/comments/${req.query.user_id}`);
});

app.get("/comments/:user_id", (req, res) => {
  res.render('comments', { userId: req.params.user_id });
});

app.post("/comments/:user_id", (req, res) => {
  if (req.session.userId === req.params.user_id) {
    feeds
      .publish(`private-${req.params.user_id}`, req.body)
      .then(() => res.sendStatus(204))
      .catch(err => res.status(400).send(err));
  } else {
    res.sendStatus(401);
  }
});

app.post('/feeds/tokens', (req, res) => {
  const hasPermission = (action, feedId) => {
    return action === 'READ' && feedId === `private-${req.session.userId}`;
  };

  feeds.authorizeFeed(req.body, hasPermission)
    .then(data => res.send(data))
    .catch(err => {
      res.status(400).send(`${err.name}: ${err.message}`);
    });
});

app.listen(5000);
console.log("Listening on port 5000");
