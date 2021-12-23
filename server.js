'use strict';

const express = require('express');
const uuid = require('uuid')
const bodyparser = require('body-parser')

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

class TodoItem {
  /**
   * @param {string} id 
   * @param {string} text 
   * @param {boolean} done 
   */
  constructor(id, text, done = false) {
    this.id = id;
    this.text = text;
    this.done = done;
  }
}

class TodoList {
  /**
   * 
   * @param {TodoItem[]} items 
   */
  constructor(items = []) {
    this.items = {};
    if (items.length > 0) {
      this.addItems(items);
    }
  }

  /**
   * 
   * @param {TodoItem[]} items 
   */
  addItems(items) {
    var ids = new Array();
    items.forEach(item => {
      if (! typeof item == "TodoItem" ) {
        throw 'Item is not a valid TodoItem in addItems.';
      }
      this.items[item.id] = item;
      ids.push(item.id);
    });
    return ids;
  }

  /**
   * @param {string} id 
   * @param {boolean} new_state 
   * @returns {boolean}
   */
  changeItemState(id, new_state) {
    if (id in this.items) {
      this.items[id].done = new_state;
      return true;
    }
    return false;
  }

  /**
   * @param {string[]} ids 
   * @returns {string[]} IDs of deleted items.
   */
  removeItems(ids) {
    var deletedItems = new Array();
    ids.forEach(id => {
      if (id in this.items) {
        deletedItems.push(id);
        delete this.items[id];
      }
    });
    return deletedItems;
  }

  /**
   * 
   * @returns {TodoItem[]}
   */
  itemsToList() {
    var out = new Array();
    for (const key in this.items) {
      out.push(this.items[key]);
    }
    return out;
  }

  /**
   * 
   * @returns {TodoItem[]}
   */
  getClearedItems() {
    var out = new Array();
    for (const key in this.items) {
      if (this.items[key].done) {
        out.push(this.items[key]);        
      }
    }
    return out;
  }
}

/**
 * 
 * @param {string[]} text
 * @returns {TodoItem[]} 
 */
function makeTodoItems(titles) {
  var items = new Array();
  titles.forEach( (title) => {
    items.push( new TodoItem( uuid.v4(), title ) );
  } )
  return items;
}

const initialValues = new Array("Go to store", "Buy some eggs", "Have a good time");

var todo = new TodoList( makeTodoItems(initialValues) );

// App
const app = express();

app.use(bodyparser.json())

app.get('/', (req, res) => {
  res.json(todo.itemsToList());
})

app.patch('/:id', (req, res) => {
  var id = req.params.id;
  if ( !("state" in req.body) ) {
    res.status(400);
    res.json({});
    return
  }

  var stateChanged = todo.changeItemState(id, req.body["state"]);

  if (!stateChanged) {
    res.status(404);
    res.json({});
    return
  }

  res.status(200);
  res.json(todo.itemsToList());
})

app.delete('/:id', (req, res) => {
  var id = req.params.id;
  var itemsRemoved = todo.removeItems(new Array(id));
  
  if (itemsRemoved.length !== 1) {
    res.status(404);
    res.json({});
    return
  }

  res.status(200);
  res.json(itemsRemoved);
  // ignore the body
})

app.post('/', (req, res) => {
  if ( ! ("items" in req.body) ) {
    res.status(400);
    res.json({});
    return
  }

  var toAdd = req.body.items.map( (item) => new TodoItem(uuid.v4(), item) );
  var addedIds = todo.addItems(toAdd);

  res.status(200);
  res.json(toAdd);
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);