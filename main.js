const { app, BrowserWindow, ipcMain } = require('electron');
const { event } = require('jquery');
const sqlite3 = require('sqlite3').verbose();
const { dbQuery } = require('./logic/queryDb.js');
var db;
var currentUser;

var window;
function createWindow () {
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  })
  window = win;
  win.maximize()

  win.loadFile('views/login.html');
  win.webContents.openDevTools();
}


app.whenReady().then(createWindow)
app.whenReady().then(createDatabase())


ipcMain.on('loggedIn', function(event, logged_in, current_user){
  if(logged_in == true){
    currentUser = current_user;
    window.loadFile('views/index.html')
  }
});
ipcMain.on('getUserDepot', function(event, test){
  event.returnValue = currentUser.depot_list;
});
app.allowRendererProcessReuse = false;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});

async function createDatabase(){
  try{
    var opend = await openDB('./db/app.db')
    if(opend){
       //create db table for adding new title, if already not exists
      await db.run('CREATE TABLE IF NOT EXISTS currentStocks(depot_name text, isin text, lot integer, bid_price real, buying_cost real, buying_date text, tax real, insert_date text, insert_time text)');
      //create db table for adding values to depot, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS addValues(depot_name text, old_depot_amount real, new_value_to_add real, costs real, deposit_date text, insert_date text, insert_time text)');
      //create db table for creating new depot, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS depot(depot_name text, current_depot_value real, initial_value_to_add real, costs real, opening_date text, user_id text, insert_date text, insert_time text)');
      //create db table for adding stocks that have been sold, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS soldStock(depot_name text, isin text, sold_lot integer, sold_price real, selling_cost real, other_costs real, selling_date text, selling_tax real, insert_date text, insert_time text)');
      //create db table for withdrawing deposit from depot, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS withdrawDeposit(depot_name text, old_depot_amount real, amount_to_withdraw real, costs real, withdraw_date text, insert_date text, insert_time text)');
      //create db table for dividend, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS addDividend(depot_name text, isin text, security_lot real, dividend_per_security real, currency text, dividend_record_date text, tax real, dividend_received_date text, conversation_rate real, other_costs real, insert_date text, insert_time text)');
      //create db table for stock, if already not exist
      await db.run('CREATE TABLE IF NOT EXISTS stock(isin text, title_name text, wkn text, symbol text, insert_date text, insert_time text)');
      await db.run('CREATE TABLE IF NOT EXISTS users(user_name text, user_id text UNIQUE, password text, email_address text, birth_date text, secret_question_1 text, secret_question_2 text, secret_question_3 text, profile_creation_date text, profile_creation_time text)');
    }
  }catch(e){
    console.log(e);
  }finally{
    db.close();
  }
}

function openDB(path) {
  return new Promise(function(resolve) {
  db = new sqlite3.Database(path, 
      function(err) {
          if(err) reject("Open error: "+ err.message)
          else    resolve(path + " opened")
          
      }
  )   
  })
}