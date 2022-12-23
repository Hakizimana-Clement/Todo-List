const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();
const app = express();

mongoose.set("strictQuery", true);
const url =
  "mongodb+srv://" +
  process.env.DATABASE_USERNAME +
  ":" +
  process.env.DATABASE_PASSWORD +
  "@cluster0.fzfjyqq.mongodb.net/TodoListDB?authSource=admin";

mongoose
  .connect(url)
  .then(() => {
    console.log("Connected to database !!");
  })
  .catch((err) => {
    console.log("Connection failed !! " + err.message);
  });

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

///////////////////// Item  //////////////////////////
// itemschema
const itemsSchema = new mongoose.Schema({
  name: String,
});
// model item
const Item = new mongoose.model("Item", itemsSchema);

///////////////////// lists  //////////////////////////
// listschema
const listsSchema = {
  name: String,
  items: [itemsSchema],
};
// model lists
const List = new mongoose.model("List", listsSchema);

// create default item list
const item1 = new Item({
  name: "Welcome to your ToDo list",
});
const item2 = new Item({
  name: "Click on + to add new Item",
});
const item3 = new Item({
  name: "<-- Hit this to delete Item",
});
const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItem) {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (!err) {
          console.log("successfully saved item in TodoListDB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItem });
    }
  });
});
//////////////////////////// CREATE NEW ITEM ///////////////////////
app.post("/", function (req, res) {
  const item = req.body.newItem;
  const title = req.body.list;

  const newItem = new Item({
    name: item,
  });

  if (title === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: title }, function (err, foundOneList) {
      foundOneList.items.push(newItem);
      foundOneList.save();
      res.redirect("/" + title);
    });
  }
});
////////////////////// DELETE ITEM /////////////////////////////
app.post("/delete", function (req, res) {
  const checkboxItemId = req.body.checkbox;
  const deletedTitle = req.body.itemDeleted;

  if (deletedTitle === "Today") {
    Item.findByIdAndRemove(
      { _id: checkboxItemId },
      function (err, deletedItem) {
        if (!err) {
          console.log("successfully deleted item in TodolistDB");
        }
        res.redirect("/");
      }
    );
  } else {
    List.findOneAndUpdate(
      { name: deletedTitle },
      { $pull: { items: { _id: checkboxItemId } } },
      function (err) {
        if (!err) {
          console.log("Successfully deleted item in TodolistDB");
        }
      }
    );
    res.redirect("/" + deletedTitle);
  }
});
//////////////////////// DYNAMIC ROUTE /////////////////////
app.get("/:customNameList", function (req, res) {
  const dynamicRoute = _.capitalize(req.params.customNameList);
  List.findOne({ name: dynamicRoute }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const Lists = new List({
          name: dynamicRoute,
          items: defaultItems,
        });

        Lists.save();
        res.redirect("/" + dynamicRoute);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started successfully");
});
