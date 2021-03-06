// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Requiring Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools
var cheerio = require("cheerio");
var axios = require("axios");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

//Define port
var port = process.env.PORT || 3000

// Initialize Express
var app = express();

// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scrapping";
//mongoose.connect("mongodb://localhost/scrapping", { useNewUrlParser: true });
mongoose.connect(MONGODB_URI);
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======

//GET requests to render Handlebars pages
app.get("/", function(req, res) {
  Article.find({"saved": false}, function(error, dataUnsaved) {
    Article.find().count({"saved": true}, function(err, dataSaved) {
      var hbsObject = {
        title: "All Movie News",
        article: dataUnsaved,
        savedArticle: dataSaved
      };
      console.log(hbsObject);
      res.render("home", hbsObject);
    });
  });
});

app.get("/saved", function(req, res) {
  Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
    Article.find().count({"saved": true}, function(err, dataSaved) {
      var hbsObject = {
        title: "Saved News",
        article: articles,
        savedArticle: dataSaved,
      };
      console.log(articles)
    res.render("saved", hbsObject);
    });
  });
});

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.cbr.com/category/movies/news-movies/") 
  .then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".w-browse-clip>article.browse-clip").each(function(i, element) {
        // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element)
        .find('a.bc-title-link').text();
      result.link = $(element)
        .find('a.bc-title-link').attr('href');
      result.body = $(element)
        .find('p.bc-excerpt').text();
      result.images = $(element)
        .find('picture').children("source").attr("data-srcset");

      // Create a new Article using the `result` object built from scraping
      Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
    res.send("scrapped")
  });
});

//Clear all aticles
app.get("/delete", function(req,res) {
  Article.remove({}, function(err) {
    Note.remove({}, function(error){
      res.redirect("/")
    });
  });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Save an article
app.post("/articles/save/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res) {
      // Use the article id to find and update its saved boolean
      Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
});


// Create a new note
app.post("/notes/save/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  // And save the new note the db
  newNote.save(function(error, note) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's notes
      Article.findOneAndUpdate({ "_id": req.params.id }, {$push: { "notes": note } })
      // Execute the above query
      .exec(function(err) {
        // Log any errors
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          // Or send the note to the browser
          res.send(note);
        }
      });
    }
  });
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
  // Use the note id to find and delete it
  Note.findOneAndRemove({ "_id": req.params.note_id }, function(err) {
    // Log any errors
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.note_id}})
       // Execute the above query
        .exec(function(err) {
          // Log any errors
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            // Or send the note to the browser
            res.send("Note Deleted");
          }
        });
    }
  });
});

// Listen on port
app.listen(port, function() {
  console.log("App running on port " + port);
});









//app.get("/scrape", function(req, res) {
//  // First, we grab the body of the html with axios
//  axios.get("https://www.cbr.com/category/movies/news-movies/") 
//  .then(function(response) {
//    // Then, we load that into cheerio and save it to $ for a shorthand selector
//    var $ = cheerio.load(response.data);
//
//    // Now, we grab every h2 within an article tag, and do the following:
//    $(".w-browse-clip>article.browse-clip").each(function(i, element) {
//        // Save an empty result object
//      var result = {};
//
//      // Add the text and href of every link, and save them as properties of the result object
//      result.title = $(element)
//        .find('a.bc-title-link').text();
//      result.link = $(element)
//        .find('a.bc-title-link').attr('href');
//      result.body = $(element)
//        .find('p.bc-excerpt').text();
//
//      // Create a new Article using the `result` object built from scraping
//      db.Article.create(result)
//        .then(function(dbArticle) {
//          // View the added result in the console
//          console.log(dbArticle);
//        })
//        .catch(function(err) {
//          // If an error occurred, log it
//          console.log(err);
//        });
//    });
//    res.redirect("/");
//  });
//});