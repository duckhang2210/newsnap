// Require mongoose
var mongoose = require("mongoose");
var Note = require("./Note");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  body: {
    type: String,
//    required: true
  },
  link: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  },
  images: {
    type: String,
    required: true
  },
  notes: [{
     type: Schema.Types.ObjectId,
     ref: "Note"
  }]
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;
