const ipcRenderer = require('electron').ipcRenderer;
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
var path = require('path');

const request = require('request');
const dbQuery = require(path.join(__dirname,'..','logic','queryDb.js'));
const depot = require(path.join(__dirname,'..','logic','depot.js'));//require('D:/Electron App/assetmanagementsystem/logic/depot.js');

window.onload = function(){
    var userDepotList = ipcRenderer.sendSync("getUserDepot");
    var currentDepot = undefined;
    var userDepotListHtlm = undefined;
    userDepotList = userDepotList.filter(e => e !== null);
    if(userDepotList.length>0){getDepotNameHtml(userDepotList)}
    if(userDepotListHtlm != undefined){
        document.querySelector("#navSelectDepot").insertAdjacentHTML('beforeend', userDepotListHtlm);        
        var currentDepotName = $('#navSelectDepot :selected').text();
        query = "SELECT d.depot_name, d.current_depot_value, d.opening_date, d.costs, d.initial_value_to_add, s.isin, title_name, lot, bid_price AS buying_price, buying_cost, buying_date, av.total_investment  FROM depot AS d LEFT JOIN (SELECT depot_name, sum(new_value_to_add)-sum(costs) as total_investment FROM addValues Group by depot_name) as av ON (d.depot_name = av.depot_name) LEFT JOIN currentStocks AS cs ON (d.depot_name = cs.depot_name) LEFT JOIN stock AS s ON (cs.isin = s.isin) WHERE d.depot_name = '"+currentDepotName+"'";
        getAllRowsFromDB(query).then((val)=>{                    
            var res = JSON.stringify(val);
            fs.writeFileSync(path.join(__dirname,'..','views','data.json'),res);
            var stockList = [];
            var totalInvestment = 0;
            if(val[0].total_investment > 0 || val[0].total_investment != null) {totalInvestment = val[0].total_investment;}
            if(val != undefined){     
                val.forEach(element => {
                    if(element.isin != null){
                        stockList.push(new depot.Stock(element.isin, element.title_name, element.lot, element.buying_price, element.buying_cost, element.buying_date))
                    }
                })
                currentDepot = new depot.Depot(currentDepotName, val[0].current_depot_value, val[0].costs, val[0].initial_value_to_add, val[0].opening_date, stockList, totalInvestment)
                
                $('#myTable').bootstrapTable({
                    url: 'data.json',
                    rememberOrder:true,
                    columns: [{
                        field: 'isin',
                        title: 'isin',
                        sortable: true,
                        searchHighlightFormatter: true
                      },{
                        field: 'title_name',
                        title: 'Security Name',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'buying_price',
                        title: 'Buying Price'
                      },{
                        field: 'lot',
                        title: 'Lot'
                      },{
                        field: 'buying_cost',
                        title: 'Costs'
                      }, {
                        field: 'buying_date',
                        title: 'Buying Date',
                        sortable: true,
                        searchHighlightFormatter: true
                      }]
                  });
            }else{
                
                //TODO:Check what happens if there val != undefined, not testest 
                currentDepot = new depot.Depot(currentDepotName, val[0].current_depot_value, val[0].costs, val[0].initial_value_to_add, val[0].opening_date, stockList, totalInvestment)
                
                $('#myTable').bootstrapTable({
                    url: 'data.json',
                    rememberOrder:true,
                    strictSearch:true,
                    columns: [{
                        field: 'isin',
                        title: 'isin',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'title_name',
                        title: 'Security Name',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'buying_price',
                        title: 'Buying Price'
                      }, {
                        field: 'lot',
                        title: 'Lot'
                      },{
                        field: 'buying_cost',
                        title: 'Costs'
                      }, {
                        field: 'buying_date',
                        title: 'Buying Date',
                        sortable: true,
                        searchHighlightFormatter: true
                      }]
                  });
            }
            updateCardValues(currentDepot.getNumberOfCurrentStocks(),currentDepot.getTotalDepotValue(), currentDepot.currentDepotValue, currentDepot.totalInvestment)

        })       
        
    }else{
        showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section');        
    }
    const home = document.getElementById('homeBtn');
    home.addEventListener('click', function(){
        window.location.reload();
    })  
    
    
    
    const currentDepotElement = document.getElementById("navSelectDepot");
    currentDepotElement.addEventListener('change', (e)=>{
        var currentDepotName = $('#navSelectDepot :selected').text();
        query = "SELECT d.depot_name, d.current_depot_value, d.opening_date, d.costs, d.initial_value_to_add, s.isin, title_name, lot, bid_price AS buying_price, buying_cost, buying_date, (cs.insert_date || cs.insert_time) as insert_time, av.total_investment  FROM depot AS d LEFT JOIN (SELECT depot_name, sum(new_value_to_add)-sum(costs) as total_investment FROM addValues Group by depot_name) as av ON (d.depot_name = av.depot_name) LEFT JOIN currentStocks AS cs ON (d.depot_name = cs.depot_name) LEFT JOIN stock AS s ON (cs.isin = s.isin) WHERE d.depot_name = '"+currentDepotName+"'";
        getAllRowsFromDB(query).then((val)=>{                    
            var res = JSON.stringify(val);
            fs.writeFileSync(path.join(__dirname,'..','views','data.json'),res);
            var stockList = [];
            var totalInvestment = 0;
            if(val[0].total_investment > 0 || val[0].total_investment != null) {totalInvestment = val[0].total_investment;}
            if(val != undefined){     
                val.forEach(element => {
                    if(element.isin != null){
                        stockList.push(new depot.Stock(element.isin, element.title_name, element.lot, element.buying_price, element.buying_cost, element.buying_date, element.insert_time))
                    }
                })
                currentDepot = new depot.Depot(currentDepotName, val[0].current_depot_value, val[0].costs, val[0].initial_value_to_add, val[0].opening_date, stockList, totalInvestment)
                
                $('#myTable').bootstrapTable({
                    url: 'data.json',
                    rememberOrder:true,
                    columns: [{
                        field: 'isin',
                        title: 'isin',
                        sortable: true,
                        searchHighlightFormatter: true
                      },{
                        field: 'title_name',
                        title: 'Security Name',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'buying_price',
                        title: 'Buying Price'
                      },{
                        field: 'lot',
                        title: 'Lot'
                      },{
                        field: 'buying_cost',
                        title: 'Costs'
                      }, {
                        field: 'buying_date',
                        title: 'Buying Date',
                        sortable: true,
                        searchHighlightFormatter: true
                      }]
                  });
            }else{
                
                //TODO:Check what happens if there val != undefined, not testest 
                currentDepot = new depot.Depot(currentDepotName, val[0].current_depot_value, val[0].costs, val[0].initial_value_to_add, val[0].opening_date, stockList, totalInvestment)
                
                $('#myTable').bootstrapTable({
                    url: 'data.json',
                    rememberOrder:true,
                    strictSearch:true,
                    columns: [{
                        field: 'isin',
                        title: 'isin',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'title_name',
                        title: 'Security Name',
                        sortable: true,
                        searchHighlightFormatter: true
                      }, {
                        field: 'buying_price',
                        title: 'Buying Price'
                      }, {
                        field: 'lot',
                        title: 'Lot'
                      },{
                        field: 'buying_cost',
                        title: 'Costs'
                      }, {
                        field: 'buying_date',
                        title: 'Buying Date',
                        sortable: true,
                        searchHighlightFormatter: true
                      }]
                  });
            }
            updateCardValues(currentDepot.getNumberOfCurrentStocks(),currentDepot.getTotalDepotValue(), currentDepot.currentDepotValue, currentDepot.totalInvestment)

        })   

    })

    const updateDepot = document.getElementById("updateDepot");
    updateDepot.addEventListener('click', function(){
        console.log("clicked")
        showAlert('infoAlert', "There is nothing to update.")
    })

    const addTitle = document.getElementById("addTitle");
    addTitle.addEventListener('click', function(){
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }
        var addTemp = document.getElementById("addTitleTemp");
        var clone = addTemp.content.cloneNode(true);
        document.getElementById("content").appendChild(clone)
    })


    const removeTitle = document.getElementById("removeTitle");
    removeTitle.addEventListener("click", function(){
        
        
        if((currentDepot.depotName != undefined && currentDepot.depotName != '')|| currentDepot != undefined){
            var securityList = currentDepot.stockList;
            if(securityList.length <=0){
                showAlert('warningAlert', 'No Securities found in the depot');
            }else{
                var parent = document.querySelector("#content");
                while(parent.firstChild){
                    parent.firstChild.remove();
                }
                var nameHtml = undefined;
                securityList.forEach((element, index) => {
                    if(index == 0){
                        nameHtml = '<option selected>'+ element.securityName+'</option>'
                        
                    }else{
                        nameHtml = nameHtml +'<option>'+ element.securityName+'</option>'
                    }
                }); 
                var removeTemp = document.querySelector("#removeTitleTemp");
                var clone = removeTemp.content.cloneNode(true);
                document.querySelector("#content").appendChild(clone);
                if(nameHtml != undefined){
                    document.querySelector("#sellingTitleName").insertAdjacentHTML('beforeend', nameHtml);
                }
            }
        }else{
            showAlert('warningAlert', 'No depot has been found for this user','First create your depot in the profile section')   
        } 
    })
    
    const addValues = document.getElementById("addValues");
    addValues.addEventListener("click", function(){
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }

        var addValuesTemp = document.querySelector("#addValuesTemp");
        var clone = addValuesTemp.content.cloneNode(true);
        document.querySelector("#content").appendChild(clone);
        if(currentDepot != undefined){
            document.getElementById('depotNameAddValues').value = currentDepot.depotName;
            document.getElementById('currentAmountAddValues').value = currentDepot.currentDepotValue;
        }

        

    })
    
    const WithdrawValues = document.getElementById("WithdrawValues");
    WithdrawValues.addEventListener("click", function(){
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }
        var withdrawTemp = document.querySelector("#withdrawValuesTemp");
        var clone = withdrawTemp.content.cloneNode(true);
        document.querySelector("#content").appendChild(clone);
        if(currentDepot != undefined){
            document.getElementById('depotName').value = currentDepot.depotName;
            document.getElementById('currentAmountWithdrawValues').value = currentDepot.currentDepotValue;
        }
    })
    
    const addDividend = document.getElementById("addDividend");
    addDividend.addEventListener("click", function(){
        let depotName = $('#navSelectDepot :selected').text();
        console.log('Step: 1');
        currentDepot = new depot.Depot(depotName);
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }
        
        var securityList = currentDepot.getStockList()
        if(securityList.length <=0){
            showAlert('warningAlert', 'No Securities found in the depot');
        }else{
            var nameHtml = undefined;
            securityList.forEach((element, index) => {
                if(index == 0){
                    nameHtml = '<option selected>'+ element+'</option>'
                    
                }else{
                    nameHtml = nameHtml +'<option>'+ element+'</option>'
                }
            }); 
            var dividendTemp = document.querySelector("#addDividendTemp")
            var clone = dividendTemp.content.cloneNode(true);
            document.querySelector("#content").appendChild(clone);
            if(nameHtml != undefined){
                document.querySelector("#securityNameAddDividend").insertAdjacentHTML('beforeend', nameHtml);                
            }
        }
    })

    const createDepot = document.getElementById("createNewDepotBtn");
    createDepot.addEventListener("click", function(){
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }
        var createDepotTemp = document.querySelector("#createDepotTemp");
        var clone = createDepotTemp.content.cloneNode(true);
        document.querySelector("#content").appendChild(clone);
    })

    const addNewTitle = document.getElementById("newTitle");
    addNewTitle.addEventListener("click", function(){
        var parent = document.querySelector("#content");
        while(parent.firstChild){
            parent.firstChild.remove();
        }
        var createDepotTemp = document.querySelector("#addNewTitleTemp");
        var clone = createDepotTemp.content.cloneNode(true);
        document.querySelector("#content").appendChild(clone);
    })
   
    async function createDatabase(){
        var deferred = $.Deferred();
        let db = await new sqlite3.Database('./db/app.db',(err)=>{
            if(err){
                alert(err+"\nTip: Restart app.");
            }
        });
            //create db table for adding new title, if already not exists
            await db.run('CREATE TABLE IF NOT EXISTS currentStocks(depot_name text, isin text, lot integer, bid_price real, buying_cost real, buying_date text, tax real, insert_date text, insert_time text)');
            //create db table for adding values to depot, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS addValues(depot_name text, old_depot_amount real, new_value_to_add real, costs real, deposit_date text, insert_date text, insert_time text)');
            //create db table for creating new depot, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS depot(depot_name text, current_depot_value real, initial_value_to_add real, costs real, opening_date text, insert_date text, insert_time text)');
            //create db table for adding stocks that have been sold, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS soldStock(depot_name text, isin text, sold_lot integer, sold_price real, selling_cost real, other_costs real, selling_date text, selling_tax real, insert_date text, insert_time text)');
            //create db table for withdrawing deposit from depot, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS withdrawDeposit(depot_name text, old_depot_amount real, amount_to_withdraw real, costs real, withdraw_date text, insert_date text, insert_time text)');
            //create db table for dividend, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS addDividend(depot_name text, isin text, security_lot real, dividend_per_security real, currency text, dividend_record_date text, tax real, dividend_received_date text, conversation_rate real, other_costs real, insert_date text, insert_time text)');
            //create db table for stock, if already not exist
            await db.run('CREATE TABLE IF NOT EXISTS stock(isin text, title_name text, wkn text, symbol text, insert_date text, insert_time text)');

        
        db.close();
        deferred.resolve(true);
        return deferred.promise();
    }

    function instantiateDepot(){
        let query = 'SELECT distinct depot_name FROM depot;'
        var options;
        var deferred = $.Deferred();
        getAllRowsFromDB(query).then((value)=>{
            console.log(value);
            options = getDepotNameHtml(value);
            if(options != undefined){
                document.querySelector("#navSelectDepot").insertAdjacentHTML('beforeend', options);
                
                query = "Select s.isin, title_name, lot, bid_price as buying_price, buying_cost, buying_date  from currentStocks as cs join stock as s on(cs.isin = s.isin) where depot_name = '"+currentDepot.depotName+"'";
                getAllRowsFromDB(query).then((val)=>{                    
                    var res = JSON.stringify(val);
                    fs.writeFileSync(path.join(__dirname,'..','views','data.json'),res);
                    if(val != undefined){                        
                        $('#myTable').bootstrapTable({
                            url: 'data.json',
                            rememberOrder:true,
                            columns: [{
                                field: 'isin',
                                title: 'isin',
                                sortable: true,
                                searchHighlightFormatter: true
                              },{
                                field: 'title_name',
                                title: 'Security Name',
                                sortable: true,
                                searchHighlightFormatter: true
                              }, {
                                field: 'buying_price',
                                title: 'Buying Price'
                              },{
                                field: 'lot',
                                title: 'Lot'
                              },{
                                field: 'buying_cost',
                                title: 'Costs'
                              }, {
                                field: 'buying_date',
                                title: 'Buying Date',
                                sortable: true,
                                searchHighlightFormatter: true
                              }]
                          });
                        let depotName = $('#navSelectDepot :selected').text();
                        currentDepot = new depot.Depot(depotName)

                    }else{
                        $('#myTable').bootstrapTable({
                            url: 'data.json',
                            rememberOrder:true,
                            strictSearch:true,
                            columns: [{
                                field: 'isin',
                                title: 'isin',
                                sortable: true,
                                searchHighlightFormatter: true
                              }, {
                                field: 'title_name',
                                title: 'Security Name',
                                sortable: true,
                                searchHighlightFormatter: true
                              }, {
                                field: 'buying_price',
                                title: 'Buying Price'
                              }, {
                                field: 'lot',
                                title: 'Lot'
                              },{
                                field: 'buying_cost',
                                title: 'Costs'
                              }, {
                                field: 'buying_date',
                                title: 'Buying Date',
                                sortable: true,
                                searchHighlightFormatter: true
                              }]
                          });
                          let depotName = $('#navSelectDepot :selected').text();
                          currentDepot = new depot.Depot(depotName)
                    }
                })
                //let depotName = $('#navSelectDepot :selected').text();
                //currentDepot = new depot.Depot(depotName)
               /* $('#myTable').bootstrapTable({
                    url: 'data.json',
                    columns: [{
                      field: 'isin',
                      title: 'isin'
                    }, {
                      field: 'title_name',
                      title: 'Item Name'
                    }, {
                      field: 'wkn',
                      title: 'WKN'
                    }, {
                        field: 'symbol',
                        title: 'Symbol'
                    }, {
                        field: 'insert_date',
                        title: 'Insert Date'
                    }, {
                        field: 'insert_time',
                        title: 'Insert Time'
                    }],
                    [{
                              field: 'depot_name',
                              title: 'Depot Name',
                              sortable: true,
                              searchHighlightFormatter: true
                            }, {
                              field: 'isin',
                              title: 'ISIN'
                            }, {
                              field: 'lot',
                              title: 'Lot'
                            }, {
                                field: 'bid_price',
                                title: 'Buying Price'
                            }, {
                                field: 'buying_cost',
                                title: 'Buying Cost'
                            }, {
                                field: 'buying_date',
                                title: 'Buying Date'
                            }, {
                                field: 'tax',
                                title: 'Tax'
                            }, {
                                field: 'insert_date',
                                title: 'Insert Date'
                            }, {
                                field: 'insert_time',
                                title: 'Insert Time'
                            }]
                  });*/
                deferred.resolve(true);
            }else{
                showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section')
                deferred.reject(false)
            }
            
        })
        return deferred.promise();
    }
    function txt_onfocus(txt) {
        txt.style.backgroundColor = "yellow";
    }
    //only when the html elements of content div has changed, register the following events    
    $('body').on('DOMSubtreeModified', '#content', function(){
        //register submit eventlistner on form
        $('form').unbind('submit').bind('submit', function(event) {
            //handle addTitle form
            if($('#AddTitleForm').length){
                if(currentDepot.depotName != undefined && currentDepot.depotName != ''){                
                    $('#confirmationModal').modal('show'); // show Confiramtion Modal
                    $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                        $('#confirmationModalContent').empty();
                        $('#confirmationModal').find('.modal-body').append('<h5>Do you really want to add this title to depot?</h5>');
                        $('#saveChangesBtn').unbind('click').bind('click', function(){
                            var isinCorrect = currentDepot.isinExists(document.getElementById('AddTitleForm').elements.namedItem('titleIsin').value);
                            var totalCostsToBuy = parseInt(document.getElementById('AddTitleForm').elements.namedItem('buyingLot').value) *
                                parseFloat(document.getElementById('AddTitleForm').elements.namedItem('buyingPrice').value) +
                                parseFloat(document.getElementById('AddTitleForm').elements.namedItem('buyingCosts').value) +
                                parseFloat(document.getElementById('AddTitleForm').elements.namedItem('inputTax').value);
                                var depositEnough = currentDepot.checkAvailableLiquid(totalCostsToBuy);
                            if(isinCorrect){                            
                                if(depositEnough){
                                    updateDatabase(document.getElementById('AddTitleForm'), 'AddTitle').then((value)=>{
                                        if(value==true){
                                            showAlert('successAlert','Title is added to depot')
                                            var query = "Update depot set current_depot_value ='"+ parseFloat(parseFloat(currentDepot.currentDepotValue) - parseFloat(totalCostsToBuy)) + "' where depot_name = '"+ currentDepot.depotName+ "'";
                                            alterRowInTable(query).then(()=>{
                                                setTimeout(reloadWindow, 3000);
                                            })
                                            
                                        }else{
                                            showAlert('failedAlert','Isin is not correct')
                                        }
                                    });
                                }else{
                                    showAlert('failedAlert','Depot does not have enough credit to buy the title',"Current Liquid Assets: "+currentDepot.currentDepotValue+"; Total Amount required: "+totalCostsToBuy)
                                }
                                
                            }else{
                                let query = "Select * from stock where isin = '" + document.getElementById('AddTitleForm').elements.namedItem('titleIsin').value +"'";
                                getFirstRowFromDB(query).then((resolve,reject)=>{
                                    if(resolve != undefined){
                                        if(depositEnough){
                                            updateDatabase(document.getElementById('AddTitleForm'), 'AddTitle').then((value)=>{
                                                if(value==true){
                                                    showAlert('successAlert','Title is added to depot')
                                                    var query = "Update depot set current_depot_value ='"+ parseFloat(parseFloat(currentDepot.currentDepotValue) - parseFloat(totalCostsToBuy)) + "' where depot_name = '"+ currentDepot.depotName+ "'";
                                                    alterRowInTable(query).then(()=>{
                                                        setTimeout(reloadWindow, 3000);
                                                    })
                                                }else{
                                                    showAlert('failedAlert','Isin is not correct')
                                                }
                                            });
                                        }else{
                                            showAlert('failedAlert','Depot does not have enough credit to buy the title.',"Current Liquid Assets: "+currentDepot.currentDepotValue+"; Total Amount required: "+totalCostsToBuy)
                                        }                                    
                                    }else{
                                        showAlert('warningAlert','Security is not found in Database. Update database first using Add New Title and then the title will be available')
                                    }
                                });
                                
                            }
                            
                        })
                    }); 
                }else{
                    showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section')
                }
            }
            //handle addValues form
            if($('#AddValuesForm').length){  
                if(currentDepot.depotName != undefined && currentDepot.depotName != ''){
                    $('#confirmationModal').modal('show'); // show Confiramtion Modal
                    $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                        $('#confirmationModalContent').empty();
                        $('#confirmationModal').find('.modal-body').append('<h6>Do you really want to add values to depot?</h6>');
                        $('#saveChangesBtn').unbind('click').bind('click', function(){
                            updateDatabase(document.getElementById('AddValuesForm'), 'addvalues').then((values)=>{
                                if(values){
                                    showAlert('successAlert','Deposit has been added to Depot');
                                    var newAmount = parseFloat(document.getElementById('AddValuesForm').elements.namedItem('newAmount').value) + parseFloat(currentDepot.currentDepotValue) - parseFloat(document.getElementById('AddValuesForm').elements.namedItem('depositCosts').value)
                                    var query = `Update depot set current_depot_value =`+ newAmount + ` where depot_name = '`+ currentDepot.depotName+ `' and insert_time = '`+currentDepot.insertTime+`' and insert_date = '`+currentDepot.insertDate+`'`
                                    alterRowInTable(query).then((values)=>{
                                        if(values){
                                            let depotName = $('#navSelectDepot :selected').text();
                                            console.log('Step: 1');
                                            currentDepot = new depot.Depot(depotName);
                                            console.log(currentDepot)
                                        }else{
                                            showAlert('failedAlert','Database could not be updated')
                                        }
                                    });
                                    
                                }else{
                                    showAlert('failedAlert','Database could not be updated')
                                }
                            });
                        })
                    }); 
                }else{
                    showAlert('warningAlert', 'No depot has been found for this user to add values to','Create first your depot in the profile section')
                }          
            }
            //handle addValues form
            if($('#withdrawValuesForm').length){  
                if(currentDepot.depotName != undefined && currentDepot.depotName != ''){    
                    $('#confirmationModal').modal('show'); // show Confiramtion Modal
                    $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                        $('#confirmationModalContent').empty();
                        $('#confirmationModal').find('.modal-body').append('<h5>Do you really want to widthdraw values from depot?</h5>');
                        $('#saveChangesBtn').unbind('click').bind('click', function(){
                            var totalAmountToWithdraw = parseInt(document.getElementById('withdrawValuesForm').elements.namedItem('amountToWithdraw').value) +
                            parseFloat(document.getElementById('withdrawValuesForm').elements.namedItem('withdrawCosts').value);
                            var liquidEnough = currentDepot.checkAvailableLiquid(totalAmountToWithdraw);
                            if(liquidEnough){
                                updateDatabase(document.getElementById('withdrawValuesForm'), 'withdrawValues').then((values)=>{
                                    if(values){
                                        showAlert('successAlert','Deposit has been withdrawn from Depot');
                                        var newAmount = parseFloat(currentDepot.currentDepotValue) - parseFloat(document.getElementById('withdrawValuesForm').elements.namedItem('amountToWithdraw').value) - parseFloat(document.getElementById('withdrawValuesForm').elements.namedItem('withdrawCosts').value)
                                        var query = `Update depot set current_depot_value =`+ newAmount + ` where depot_name = '`+ currentDepot.depotName+ `' and insert_time = '`+currentDepot.insertTime+`' and insert_date = '`+currentDepot.insertDate+`'`
                                        alterRowInTable(query).then((values)=>{
                                            if(values){
                                                let depotName = $('#navSelectDepot :selected').text();
                                                currentDepot = new depot.Depot(depotName);
                                            }else{
                                                showAlert('failedAlert','Database could not be updated')
                                            }
                                        });
                                        
                                    }else{
                                        showAlert('failedAlert','Database could not be updated')
                                    }
                                });
                            }else{
                                showAlert('failedAlert','Enough deposit is not available.')
                            }
                            
                        })
                    }); 
                }else{
                    showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section')
                }             
            }
            //handle remove stock from depot
            if($('#removeTitleForm').length){
                if(currentDepot.depotName != undefined && currentDepot.depotName != ''){
                    $('#confirmationModal').modal('show');
                    $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                        $('#confirmationModalContent').empty();
                        $('#confirmationModal').find('.modal-body').append('<h5>Do you really want to remove this title from depot?</h5>');
                    
                        $('#saveChangesBtn').unbind('click').bind('click', function(){
                            updateDatabase(document.getElementById('removeTitleForm'), 'removeTitle').then((value)=>{
                                if(value==true){
                                    showAlert('successAlert','Security is removed from current depot')
                                    var queryList = [];
                                    var sellingTitleName = currentDepot.getISIN(document.getElementById('removeTitleForm').elements.namedItem('sellingTitleName').value)
                                    var sellingLot = currentDepot.getISIN(document.getElementById('removeTitleForm').elements.namedItem('soldLot').value)
                                    queryList[0] = "DELETE FROM currentStocks WHERE isin = '"+sellingTitleName+"' and lot = '"+sellingLot+"' "
                                    queryList[1] = "Update depot set current_depot_value ="+ newAmount + ` where depot_name = '`+ currentDepot.depotName+ `' and insert_time = '`+currentDepot.insertTime+`' and insert_date = '`+currentDepot.insertDate+`'`
                                    
                                }else{
                                    showAlert('failedAlert','Security could not be removed from depot')
                                }
                            });
                        });
                    }); 
                }else{
                    showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section')
                } 
            }
            if($('#createDepotForm').length){
                let query = 'Select count(*) As count From depot Where '+"depot_name =" +"'"+document.getElementById('createDepotForm').elements.namedItem('depotName').value+"'";
                //Check if depot with the same name already exists
                dataExists(query).then(function(value){
                    if(value==false){
                        alert('Depot with the same name already exists.\nTo create a new depot, provide a unique name.')
                    }else{
                        updateDatabase(document.getElementById('createDepotForm'), 'createDepot').then((value)=>{
                            if(value){
                                window.location.reload();
                                showAlert('successAlert','Depot has been created');
                                let depotName = document.getElementById('createDepotForm').elements.namedItem('depotName').value;
                                currentDepot = new depot.Depot(depotName);
                                console.log(currentDepot);
                            }else{
                                showAlert('failedAlert','Database could not be updated')
                            }
                        });                    
                    }
                })

            }
            if($('#AddDividendForm').length){
                if(currentDepot.depotName != undefined && currentDepot.depotName != ''){                  
                    $('#confirmationModal').modal('show'); // show Confiramtion Modal
                    $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                        $('#confirmationModalContent').empty();
                        $('#confirmationModal').find('.modal-body').append('<h5>Do you really want to add this dividend to depot?</h5>');
                        $('#saveChangesBtn').unbind('click').bind('click', function(){

                            updateDatabase(document.getElementById('AddDividendForm'), 'AddDividend').then((value)=>{
                                if(value==true){
                                    showAlert('successAlert','Dividend is added to depot');
                                    var newAmount = (parseFloat(document.getElementById('AddDividendForm').elements.namedItem('seurityLotAddDividend').value) * parseFloat(document.getElementById('AddDividendForm').elements.namedItem('dividend').value) * parseFloat(document.getElementById('AddDividendForm').elements.namedItem('conversionRateDividend').value)) - parseFloat(document.getElementById('AddDividendForm').elements.namedItem('WithholdingTax').value) - parseFloat(document.getElementById('AddDividendForm').elements.namedItem('otherCostsDividend').value) + parseFloat(currentDepot.currentDepotValue)
                                    var query = `Update depot set current_depot_value =`+ newAmount + ` where depot_name = '`+ currentDepot.depotName+ `' and insert_time = '`+currentDepot.insertTime+`' and insert_date = '`+currentDepot.insertDate+`'`
                                    console.log(currentDepot)
                                    alterRowInTable(query).then((values)=>{
                                        if(values){
                                            let depotName = $('#navSelectDepot :selected').text();
                                            currentDepot = new depot.Depot(depotName);
                                            console.log(currentDepot);
                                        }else{
                                            showAlert('failedAlert','Database could not be updated')
                                        }
                                    });
                                }else{
                                    showAlert('failedAlert','Isin is not correct')
                                }
                            });                        
                        })
                    }); 
                }else{
                    showAlert('warningAlert', 'No depot has been found for this user','Create first your depot in the profile section')
                } 
            }
            if($('#addNewTitleForm').length){
                let query = 'Select * from stock where isin ='+ "'"+document.getElementById('addNewTitleForm').elements.namedItem('newIsin').value+"'";
                dataExists(query).then((value)=>{
                    if(value){
                        showAlert('warningAlert','Title is available in the database.')
                    }else{
                        $('#confirmationModal').modal('show'); // show Confiramtion Modal
                        $('#confirmationModal').unbind('shown.bs.modal').bind('shown.bs.modal', function(){
                            $('#confirmationModalContent').empty();
                            $('#confirmationModal').find('.modal-body').append('<h5>Do you really want to add this title to database?</h5>');
                            $('#saveChangesBtn').unbind('click').bind('click', function(){
        
                                updateDatabase(document.getElementById('addNewTitleForm'), 'addNewTitle').then((value)=>{
                                    if(value==true){
                                        showAlert('successAlert','Title is added to database');
                                    }else{
                                        showAlert('failedAlert','Title could not be added to database. Try again!')
                                    }
                                });                        
                            })
                        }); 
                    }
                });               

            }
            
            return false;
        })        
    });

    function updateDatabase(form, formType){
        console.log(formType);
        var columns;
        var values;
        if(formType == 'addvalues'){
            //currentDepot.addValuesToDepot(form.elements.namedItem('newAmount').value, form.elements.namedItem('depositCosts').value, form.elements.namedItem('deposit-date-input').value);
            var columns = 'depot_name, old_depot_amount, new_value_to_add, costs, deposit_date, insert_date, insert_time';
            var values = [];
            values.push("'"+currentDepot.depotName+"'"); //depot name
            //depot current amount
            if(currentDepot.currentDepotValue==0 || currentDepot.currentDepotValue == undefined){
                values.push(0);
            }else{
                
                values.push(currentDepot.currentDepotValue); 
            }
            values.push(parseFloat(form.elements.namedItem('newAmount').value)); //new amount to add to
            values.push(parseFloat(form.elements.namedItem('depositCosts').value)); //costs for adding new amount to depot
            values.push("'"+form.elements.namedItem('deposit-date-input').value+"'"); // date of amount deposit
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now           
            var query = `INSERT INTO addValues (`+columns+`) VALUES(`+values.toString()+`)`.toString();
            var deferred = $.Deferred();
            //this.currentDepotValue = this.currentDepotValue+parseFloat(newAmount) - parseFloat(costs);        
            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
            
        }
        if(formType == 'withdrawValues'){
            //currentDepot.withdrawValuesFromDepot(form.elements.namedItem('amountToWithdraw').value, form.elements.namedItem('withdrawCosts').value, form.elements.namedItem('withdraw-date-input').value);
            columns = 'depot_name, old_depot_amount, amount_to_withdraw, costs, withdraw_date, insert_date, insert_time';
            values = [];
            values.push("'"+currentDepot.depotName+"'"); //depot name
            //depot current amount
            if(currentDepot.currentDepotValue==0){
                values.push(0);
            }else{
                
                values.push(currentDepot.currentDepotValue); 
            }
            values.push(parseFloat(form.elements.namedItem('amountToWithdraw').value)); //new amount to withdraw
            values.push(parseFloat(form.elements.namedItem('withdrawCosts').value)); //costs for adding new amount to depot
            values.push("'"+form.elements.namedItem('withdraw-date-input').value+"'"); // date of amount deposit
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now           
            var query = `INSERT INTO withdrawDeposit (`+columns+`) VALUES(`+values.toString()+`)`.toString();   
             
            //this.currentDepotValue = this.currentDepotValue - parseFloat(amount) - parseFloat(costs);
            var deferred = $.Deferred();     
            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
        }
        if(formType == 'createDepot'){
            columns = 'depot_name, current_depot_value, initial_value_to_add, costs, opening_date, insert_date, insert_time';
            values = [];
            values.push("'"+form.elements.namedItem('depotName').value+"'"); //depot name
            values.push(0); //depot current amount
            values.push(parseFloat(form.elements.namedItem('initialAmount').value)); //new amount to add to
            values.push(parseFloat(form.elements.namedItem('depotCosts').value)); //costs for adding new amount to depot
            values.push("'"+form.elements.namedItem('depot-opening-date-input').value+"'"); // opening date of new depot
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now
            var val = values.toString();            
            var query = `INSERT INTO depot (`+columns+`) VALUES(`+val+`)`.toString();
        
            var deferred = $.Deferred();     
            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
        }
        if(formType =='AddTitle'){
            columns = 'depot_name, isin, lot, bid_price, buying_cost, buying_date, tax, insert_date, insert_time';
            values = [];
            values.push("'"+currentDepot.depotName+"'"); //isin Number
            values.push("'"+form.elements.namedItem('titleIsin').value+"'"); //isin Number
            values.push(parseInt(form.elements.namedItem('buyingLot').value)); //depot current amount
            values.push(parseFloat(form.elements.namedItem('buyingPrice').value)); //new amount to add to 
            values.push(parseFloat(form.elements.namedItem('buyingCosts').value)); //costs for adding new amount to depot
            values.push("'"+form.elements.namedItem('buying-date').value+"'"); // opening date of new depot
            values.push(parseFloat(form.elements.namedItem('inputTax').value));
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now
            var query = `INSERT INTO currentStocks (`+columns+`) VALUES(`+values.toString()+`)`.toString();
            var deferred = $.Deferred();
            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
    
        }
        if(formType == 'removeTitle'){
            
            columns = 'depot_name, isin, sold_lot, sold_price, selling_cost, other_costs, selling_date, selling_tax, insert_date, insert_time';
            values = [];
            values.push("'"+currentDepot.depotName+"'"); //
            var isin = currentDepot.getISIN(form.elements.namedItem('sellingTitleName').value);
            values.push("'"+isin+"'"); //isin Number
            values.push(parseInt(form.elements.namedItem('soldLot').value)); //depot current amount
            values.push(parseFloat(form.elements.namedItem('sellingPrice').value)); //new amount to add to 
            values.push(parseFloat(form.elements.namedItem('sellingCosts').value)); //costs for adding new amount to depot
            values.push(parseFloat(form.elements.namedItem('sellingOtherCosts').value));
            values.push("'"+form.elements.namedItem('sellingDate').value+"'"); // opening date of new depot
            values.push(parseFloat(form.elements.namedItem('sellingTax').value));
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now
            var query = `INSERT INTO soldStock (`+columns+`) VALUES(`+values.toString()+`)`.toString();
            var deferred = $.Deferred();           

            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
        }
        if(formType =='AddDividend'){
            columns = 'depot_name, isin, security_lot, dividend_per_security, currency, dividend_record_date, tax, dividend_received_date, conversation_rate, other_costs, insert_date, insert_time';
            values = [];
            values.push("'"+currentDepot.depotName+"'"); //depot_name
            var isin = currentDepot.getISIN(form.elements.namedItem('securityNameAddDividend').value);
            values.push("'"+isin+"'"); //isin Number
            values.push(parseInt(form.elements.namedItem('seurityLotAddDividend').value)); //security lot
            values.push(parseFloat(form.elements.namedItem('dividend').value)); //dividend_per_security
            values.push("'"+form.elements.namedItem('currency').value+"'"); //currency
            values.push("'"+form.elements.namedItem('dividend-record-date-input').value+"'"); //dividend_record_date
            values.push(parseFloat(form.elements.namedItem('WithholdingTax').value)); //tax
            values.push("'"+form.elements.namedItem('dividend-recived-date-input').value+"'"); //dividend_received_date
            values.push(parseFloat(form.elements.namedItem('conversionRateDividend').value)); //conversation_rate
            values.push(parseFloat(form.elements.namedItem('otherCostsDividend').value)); //other_costs
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now
            var query = `INSERT INTO addDividend (`+columns+`) VALUES(`+values.toString()+`)`.toString();
            var deferred = $.Deferred();


            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
    
        }
        if(formType =='addNewTitle'){
            columns = 'isin, title_name, wkn, symbol, insert_date, insert_time';
            values = [];
            values.push("'"+form.elements.namedItem('newIsin').value+"'"); //isin Number
            values.push("'"+form.elements.namedItem('newSecurityName').value+"'"); //security name
            values.push("'"+form.elements.namedItem('newWKN').value+"'"); //Wkn
            values.push("'"+form.elements.namedItem('newSymbol').value+"'"); //Symbol
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
            values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now
            var query = `INSERT INTO stock (`+columns+`) VALUES(`+values.toString()+`)`.toString();

            var deferred = $.Deferred();
            //insert stock to dabase
            insertRowToDB(query).then((value)=>{
                if(value==true){
                    deferred.resolve(true);
                }else{
                    deferred.reject(false);
                }
            });
            return deferred.promise();
    
        }
    }
    //Delete row from database
    async function deleteRowFromDB(query){
        try{
            var deferred = $.Deferred();
            await dbQuery.open('./db/app.db')
            result = await dbQuery.get(query);
            dbQuery.close();
        }catch(error){
            deferred.reject(error);
        }
        return deferred.promise(); 
    }
    //This inserts a new row to database 
    async function insertRowToDB(query){
        var deferred = $.Deferred();
        await dbQuery.open('./db/app.db')
        result = await dbQuery.run(query);
        dbQuery.close();
        if(result==true){
            deferred.resolve(true);
        }else{
            deferred.reject(false);
        }
        return deferred.promise();
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
    //alter row in a table
    async function alterRowInTable(query){
        var deferred = $.Deferred();
        try{
            await dbQuery.open('./db/app.db')
            result = await dbQuery.run(query);
            await dbQuery.close();
            if(result==true){
                deferred.resolve(true);
            }else{
                deferred.reject(false);
            }
        }catch(error){
            console.log(error);
        }
        return deferred.promise();
    }

    //Execute a number of queries in a table
    async function alterRowsInTable(queryList){
        var deferred = $.Deferred();
        try{
            await dbQuery.open('./db/app.db')
            for(var i = 0; i < queryList.length; i++){
                result = await dbQuery.run(query);
            }            
            await dbQuery.close();
            if(result==true){
                deferred.resolve(true);
            }else{
                deferred.reject(false);
            }
        }catch(error){
            console.log(error);
        }
        return deferred.promise();
    }


    //Get all data from database
    async function getAllRowsFromDB(query){
        var deferred = $.Deferred();
        await dbQuery.open('./db/app.db')
        result = await dbQuery.all(query);
        dbQuery.close();
        try{
            if(parseInt(result.length) > 0){                     
                deferred.resolve(result);
            }else{
                deferred.resolve(undefined);
            }
        }catch(err){
            deferred.reject("Error: "+err.message+"\nDatabase Error: "+result);
        }
        return deferred.promise(); 
    }

    //Get first row from database 
    async function getFirstRowFromDB(query){
        var deferred = $.Deferred();
        await dbQuery.open('./db/app.db')
        result = await dbQuery.get(query);
        dbQuery.close();
        try{
            deferred.resolve(result);
        }catch(err){
            deferred.reject("Error: "+err.message+"\nDatabase Error: "+result);
        }
        return deferred.promise(); 
    }
    function readDataFromDababase(tableName, condition){
        var error = undefined;
        var result = undefined;
        // Configure Select statement
        var db = new sqlite3.Database('./db/app.db'); 
        try{
            if(tableName){    
                let sql;
                if(condition){
                    sql = `SELECT * FROM `+tableName +' Where '+ condition;    
                }else{
                    sql = `SELECT * FROM `+tableName;  
                }                            
                db.all(sql, [], (err, rows) => {
                    if (err) {
                        error= err;
                    }else{
                        result = rows;
                    }
                });               
                    
            }else{
                error = new Error('No table name defined.');
                result = undefined
            }
        }catch(err){
            error = err;
            result = undefined
        }finally{
            // close the database connection
            db.close();
        }
        return {error, result};
    }

    function addContentToInfoModal(depotName, oldAmount, newAmount, costs) {
        var totalAmount = oldAmount+newAmount;      
        return `
            <p>Value of depot `+depotName+` has been Updated</p>
            <p>Old amount: `+oldAmount+` </p>
            <p>Old amount: `+newAmount+` </p>
            <p>Total amount: `+totalAmount+` </p>
            <p>Cost of Transaction: `+costs+` </p>
        `;
    }
    function getDepotNameHtml(nameList){
        var nameHtml = undefined;
        if(nameList != undefined){
            nameList.forEach((element, index) => {
                if(index == 0){
                    nameHtml = '<option selected>'+ element+'</option>'
                    
                }else{
                    nameHtml = nameHtml +'<option>'+ element+'</option>'
                }
            });
        }        
        return nameHtml;
    }
    function getISIN(isin){
       /* var headers = {'Content-Type': 'application/json'};
        var dictionary = {"idType": "ID_ISIN", "idValue": isin};
        var data = dictionary;
        var response_result = {"error": "",
                            "http_error": "",
                            "result": ""
                            };

        request.post({
            url:'https://api.openfigi.com/v2/mapping', 
            headers:headers, 
            data: [data]
            }, (err, res, body) =>{
                if(err){
                    alert(err.message);
                }
                if(res){
                    alert(res);
                    response_result = res;
                }
            }
        )*/
        
        var headers = {
            'Content-Type': 'application/json'
        };

        var dataString = JSON.parse('[{"idType":"ID_ISIN","idValue":'+'"'+isin+'"'+',"exchCode":"US"}]');

        var options = {
            url: 'https://api.openfigi.com/v2/mapping',
            method: 'POST',
            headers: headers,
            body: dataString
        };
        var response_result = undefined;
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
            if(error){
                alert(error);
            }
        }
        request.post({
            url:'https://api.openfigi.com/v2/mapping', 
            headers:headers, 
            data:  dataString
            }, (err, res, body) =>{
                if(err){
                    alert(err.message);
                }
                if(res){
                    alert(res);
                    response_result = res;
                }
                if(body){
                    alert(body);
                }
            }
        )
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
            case 'infoAlert':               
                var msg = '<h4 class="alert-heading" id="alertH4">Information!</h4>'
                if(message1 != undefined){msg = msg+'<p id="alertP1">'+message1+'</p>'}
                if(message2 != undefined){msg = msg + '<hr id="alertHr">' +  '<p class="mb-0" id="alertP2">'+ message2 + '</p>'}                           
                document.querySelector("#infoAlert").insertAdjacentHTML('beforeend', msg);
                $('#infoAlert').fadeIn(1000);
                setTimeout(function() { 
                    $('#infoAlert').fadeOut(1000); 
                }, 5000);
                break;
        }
    }
    function updateCardValues(NumberOfSecurities, totalDepotValue, liquidAsset, totalInvestment){
        document.getElementById('cardNumberSecurities').innerHTML = NumberOfSecurities
        document.getElementById('cardDepotValue').innerHTML = totalDepotValue;
        document.getElementById('cardTotalInvestment').innerHTML = totalInvestment;
        document.getElementById('cardLiquidAssets').innerHTML = liquidAsset;
        
    }
    function reloadWindow(){
        window.location.reload();
    }

}


