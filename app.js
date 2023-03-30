const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const date = require(__dirname + "/date.js");

const app = express();

const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const tasks = [
    { name: "Welcome to your todo list!" },
    { name: "Hit the + button to add a new task" },
    { name: "<-- Hit this to delete a task" }
];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({})
        .then((foundItems) => {
            if (foundItems.length === 0) {
                Item.insertMany(tasks)
                    .then(() => {
                        console.log("Successfully saved all tasks to database");
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            } else {
                res.render("list", { ListTitle: "Today", newListItems: foundItems });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/:customListName", function (req, res) {
    const customListName = req.params.customListName;

    List.findOne({ name: customListName })
        .then(function (foundList) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: tasks
                });

                return list.save();
            } else {
                return foundList;
            }
        })
        .then(function (list) {
            res.render("list", { ListTitle: list.name, newListItems: list.items });
        })
        .catch(function (err) {
            console.log(err);
        });
});


app.post("/", function (req, res) {
    const itemName = req.body.NewItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName == "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(function (foundList) {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(function (err) {
                console.log(err);
            });
    }
});


app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;

    Item.findByIdAndRemove(checkedItemId)
        .then(() => {
            console.log("Item deleted successfully");
            res.redirect("/");
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Error deleting item");
        });
});


app.get("/work", function (req, res) {
    res.render("list", { ListTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("The server is started succesfully!");
});
