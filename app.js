const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const e = require('express')
const _ = require('lodash')

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
mongoose.set('useFindAndModify', false)

const itemsSchema = {
  name: String,
}

const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: 'Welcome to do list',
})

const item2 = new Item({
  name: 'Hit + button to add new item',
})

const item3 = new Item({
  name: '<- check the box to strike off the item',
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema],
}

const List = mongoose.model('List', listSchema)

app.get('/', function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('successfully saved the default items')
        }
      })
      res.redirect('/')
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItems: foundItems,
      })
    }
  })
})

app.get('/:customListName', function (req, res) {
  const customParams = _.capitalize(req.params.customListName)

  List.findOne({ name: customParams }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customParams,
          items: defaultItems,
        })

        list.save()
        res.redirect('/' + customParams)
      } else {
        // show existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        })
      }
    }
  })
})

app.post('/', function (req, res) {
  const itemName = req.body.newItem
  const listName = req.body.list

  const item = new Item({
    name: itemName,
  })

  if (listName === 'Today') {
    item.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    })
  }
})

app.post('/delete', function (req, res) {
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log('successfully deleted checked item')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          console.log('successfully deleted checked item')
          res.redirect('/' + listName)
        }
      }
    )
  }
})

app.listen(3000, function () {
  console.log('Server is running at port 3000.')
})
