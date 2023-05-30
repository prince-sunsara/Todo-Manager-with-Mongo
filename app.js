//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect to mongoDB database
mongoose.connect("mongodb+srv://prince:prince777@cluster0.bbiddqc.mongodb.net/todolistDB");


// mongoose schema
const itemSchema = new mongoose.Schema({
  name: String
});

// mongoose model
const Item = mongoose.model("Item", itemSchema);

// mongoose document
const item1 = new Item({
  name: "Welcome to your todo list!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- hit this to delete an item."
});

// arrays
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  // list all items
  Item.find().then((items) => {
    if (items.length === 0) {
      // insert items in model
      Item.insertMany(defaultItems).then(() => {
        console.log("Successfully saved default items to DB.");
      }).catch((err) => {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  }).catch((err) => {
    console.log(err);
  });

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // console.log(itemName);
  // console.log(listName);

  // create new item
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    // save the item in collection
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((list) => {
      list.items.push(item);
      list.save();
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }

});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  // console.log(listName);

  if (listName === "Today") {
    // delete the item
    Item.findByIdAndRemove(checkedItemId).then(() => {
      // console.log("Successfully deleted the Item!");
      res.redirect("/");
    }).catch((err) => {
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((list) => {
      res.redirect("/" + listName);
    });
  }


})


app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((list) => {
    if (!list) {
      console.log(customListName + " list doesn't exist, new list is created!");

      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      console.log(customListName + " List is already exist!");
      res.render("list", {
        listTitle: customListName,
        newListItems: list.items,
      });
    }
  });
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
