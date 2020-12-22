//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const bunyan = require("bunyan");

const log = bunyan.createLogger({ name: "To-do" });
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);
/**
 * Main todo list
 */
app.get("/", (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          log.error(`Error in adding to database: ${err}`);
        } else {
          log.info(`Successfully added to database ${Item}`);
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

/**
 * add new group
 */
app.get("/:groupName", (req, res) => {
  const groupName = req.params.groupName;

  List.findOne({ name: groupName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: groupName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + groupName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } else {
        log.error(`Error in adding to database: ${err}`);
      }
    });
  }
});

/**
 * delete todo list items
 */
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        log.info(`Successfully deleted checked item. ${checkedItemId}`);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        } else {
          log.error(`Error in adding to database: ${err}`);
        }
      }
    );
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  log.info(`Successfully connected to Port ${PORT}`);
});
