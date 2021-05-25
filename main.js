const { app, BrowserWindow, ipcMain } = require('electron');
const { event } = require('jquery');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbQuery = require(path.join(__dirname,'logic','queryDb.js'));
const User = require('./models/user')
//const showAlert = require('./logic/login')
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


ipcMain.on('loggedIn', async function(event, logged_in, user_name){
  if(logged_in == true){
    await getUserProfileUsingUsername(user_name).then(e =>{
      currentUser = e;
    }).catch(err=>{
      //showAlert("warningAlert", "User not found")
      console.log(err);
    })
    window.loadFile('views/index.html')
  }
});
ipcMain.on('getUserDepot', async function(event){//./db/app.db
  const db = await dbQuery.open('./db/app.db');
  let query = "SELECT d.depot_name  FROM users as u left join depot as d on(u.user_id = d.user_id) where u.user_name = '"+currentUser.user_name+"'";
  if(db.includes("opened")){
      var depot = await dbQuery.all(query);
      if(depot != undefined && depot.length > 0){
          let depotName = []
          depot.forEach(element => {
              depotName.push(element.depot_name)
          });
          currentUser.depot_list = depotName
          await dbQuery.close();
      }else{
          await dbQuery.close();
      }
  }    
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

ipcMain.on('getCurrentUser', (event)=>{event.returnValue = currentUser})

async function getUserProfileUsingUsername(user_name){
  const db = await dbQuery.open('./db/app.db');
  let query = "SELECT u.user_name, u.user_id, u.email_address, u.birth_date, d.depot_name  FROM users as u left join depot as d on(u.user_id = d.user_id) where u.user_name = '"+user_name+"'";
  if(db.includes("opened")){
      var users = await dbQuery.all(query);
      if(users != undefined && users.length > 0){
          let depotName = []
          users.forEach(element => {
              depotName.push(element.depot_name)
          });
          currentUser = new User(users[0].user_name, users[0].user_id, users[0].email_address, users[0].birth_date, depotName)
          await dbQuery.close();
      }else{
          await dbQuery.close();
      }
  }        
  return new Promise((resolve, reject)=>{
      if(currentUser){
          resolve(currentUser)
      }else{
          reject(false)
      }

  })
}