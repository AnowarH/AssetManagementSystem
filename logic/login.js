var path = require('path');
const dbQuery = require(path.join(__dirname,'..','logic','queryDb.js'));
const ipc = require('electron').ipcRenderer;

var currentUser = undefined;


window.onload = function(){
    $('form').unbind('submit').bind('submit', ()=>{
        if($('#loginForm').length){
            const loginUsername = document.getElementById('loginUsername').value
            const loginPassword = document.getElementById('loginPassword').value
            getUserProfile(loginUsername, loginPassword).then((value)=>{
                if(value == true){
                    ipc.send('loggedIn',true, currentUser);
                }else{
                    showAlert('failedAlert', "No user found with the given name.")
                }
            });
            return false;
        }
        if($('#userRegistrationForm').length){
            const userFullNameRegistrationForm = document.getElementById('userFullNameRegistrationForm').value
            const userNameRegistrationForm = document.getElementById('userNameRegistrationForm').value
            const userPass1RegistrationForm = document.getElementById('userPass1RegistrationForm').value
            const userPass2RegistrationForm = document.getElementById('userPass2RegistrationForm').value
            const securityCodeRegistrationForm = document.getElementById('securityCodeRegistrationForm').value
            if(userPass1RegistrationForm != userPass2RegistrationForm){
                showAlert('failedAlert', "Password do not match")
            }else{
                var query1 = "Select * from users where user_name = '"+userNameRegistrationForm+"'";
                dataExists(query1).then((valueExists)=>{
                    if(valueExists){
                        showAlert("failedAlert", "User with the same username already exists", "Try with a different name.")
                    }else{
                        var val = [];
                        let col = "user_name, user_id, password, email_address, birth_date, secret_question_1, profile_creation_date, profile_creation_time"
                        val.push("'"+userNameRegistrationForm+"'")
                        val.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 25).toString().replaceAll("-","").replaceAll(":","").replaceAll(".","").replaceAll(" ","")+"'"); //date part of today
                        val.push("'"+userPass1RegistrationForm+"'");
                        val.push("''");
                        val.push("''");
                        val.push("'"+securityCodeRegistrationForm+"'");
                        val.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); 
                        val.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); 
                        let query2 = "INSERT INTO users ("+col+") VALUES( "+val.toString()+")".toString();
                        updateDb(query2).then((value)=>{
                            if(value){
                                showAlert("successAlert", "User has been added to the database");
                            }else{
                                showAlert("failedAlert", "User could not be added to the database", "Try again.")
                            }
                        })
                    }
                })               

            }
           return false 
        }
        
    })
        
  }

    //This function checks if as per condition a row exists
async function dataExists(query){
    var deferred = $.Deferred();
    await dbQuery.open('./db/app.db')
    result = await dbQuery.get(query);
    dbQuery.close();
    if(result != undefined){                     
        deferred.resolve(true);
    }else{
        deferred.resolve(false);
    }
    return deferred.promise();              

}
  async function updateDb(query){
    var deferred = $.Deferred();
    const db = await dbQuery.open('./db/app.db');
    if(db.includes("opened")){
        var inserted = await dbQuery.run(query);
        if(inserted){
            deferred.resolve(true)
        }else{
            deferred.reject(false)
        }
    }
    await dbQuery.close();
    return deferred.promise();
  }

  async function getUserProfile(user_name, user_password){
    var deferred = $.Deferred();
    const db = await dbQuery.open('./db/app.db');
    let query = "SELECT u.user_name, u.user_id, u.email_address, u.birth_date, d.depot_name  FROM users as u left join depot as d on(u.user_id = d.user_id) where u.user_name = '"+user_name+"' and u.password = '"+user_password+"'";
    if(db.includes("opened")){
        var users = await dbQuery.all(query);
        if(users != undefined && users.length > 0){
            let depotName = []
            users.forEach(element => {
                depotName.push(element.depot_name)
            });
            currentUser = new user(users[0].user_name, users[0].user_id, users[0].email_address, users[0].birth_date, depotName)
            deferred.resolve(true);
        }else{
            deferred.resolve(false);
        }
    }
    await dbQuery.close();
    return deferred.promise();
  }

  class user{
    constructor(user_name, user_id, email_address, birth_date, depot_list){
        this.user_name = user_name;
        this.email_address = email_address;
        this.user_id = user_id;
        this.birth_date = birth_date;
        this.depot_list = depot_list;
    }
  }
  function showAlert(alertType, message1, message2) {
    if(document.querySelector("#alertP1")){document.querySelector("#alertP1").parentNode.removeChild(document.querySelector("#alertP1"))}
    if(document.querySelector("#alertP2")){document.querySelector("#alertP2").parentNode.removeChild(document.querySelector("#alertP2"))}
    if(document.querySelector("#alertHr")){document.querySelector("#alertHr").parentNode.removeChild(document.querySelector("#alertHr"))}
    if(document.querySelector("#alertH4")){document.querySelector("#alertH4").parentNode.removeChild(document.querySelector("#alertH4"))}                               
    switch (alertType){
        case 'successAlert':
            var msg = '<h4 class="alert-heading" id="alertH4">Successful!</h4>'
            if(message1 != undefined){msg = msg+'<p id="alertP1">'+message1+'</p>'}
            if(message2 != undefined){msg = msg + '<hr id="alertHr">' +  '<p class="mb-0" id="alertP2">'+ message2 + '</p>'} 
             document.querySelector("#successAlert").insertAdjacentHTML('beforeend', msg);
            $('#successAlert').fadeIn(1000);
            setTimeout(function() { 
                $('#successAlert').fadeOut(1000); 
            }, 5000);
            break;
        case 'warningAlert':                 
            var msg = '<h4 class="alert-heading" id="alertH4">Warning!</h4>'
            if(message1 != undefined){msg = msg+'<p id="alertP1">'+message1+'</p>'}
            if(message2 != undefined){msg = msg + '<hr id="alertHr">' +  '<p class="mb-0" id="alertP2">'+ message2 + '</p>'}             
            document.querySelector("#warningAlert").insertAdjacentHTML('beforeend', msg);
            $('#warningAlert').fadeIn(1000);
            setTimeout(function() { 
                $('#warningAlert').fadeOut(1000); 
            }, 5000);
            break;
        case 'failedAlert':               
            var msg = '<h4 class="alert-heading" id="alertH4">Failed!</h4>'
            if(message1 != undefined){msg = msg+'<p id="alertP1">'+message1+'</p>'}
            if(message2 != undefined){msg = msg + '<hr id="alertHr">' +  '<p class="mb-0" id="alertP2">'+ message2 + '</p>'}                           
            document.querySelector("#failedAlert").insertAdjacentHTML('beforeend', msg);
            $('#failedAlert').fadeIn(1000);
            setTimeout(function() { 
                $('#failedAlert').fadeOut(1000); 
            }, 5000);
            break;
    }
  }