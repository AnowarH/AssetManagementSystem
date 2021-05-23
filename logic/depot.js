const { queue } = require('jquery');
const dbQuery = require('D:/Electron App/assetmanagementsystem/logic/queryDb.js');

exports.Depot = class Depot{
    constructor(depotName, currentDepotValue, openingCosts, initialValueAdded, creationDate, stockList, totalInvestment){
        this.depotName = depotName;
        this.currentDepotValue = currentDepotValue;
        this.openingCosts = openingCosts;
        this.initialValueAdded = initialValueAdded;
        this.creationDate = creationDate;
        this.insertDate = undefined;
        this.insertTime = undefined;
        this.stockList = stockList;
        this.depot_table = undefined;
        this.totalInvestment = totalInvestment;               

    }
    //checks whether the depot has enough of deposit to buy new scurites
    checkAvailableLiquid(amount){
        if(this.currentDepotValue != undefined){
            if(this.currentDepotValue >= amount){
                return true;
            }
        }
        return false;
    }

    getISIN(securityName){
        for(var temp=0; temp<this.stockList.length; temp++){
            if(this.stockList.securityName == securityName){
                return this.stockList.isin
            }
        }
    }
    
    //TODO: This function hast to be checked, There is no WKN
    getWKN(isin, securityName){
        if(isin == undefined){
            for(var temp=0; temp<this.stockList; temp++){
                if(this.stockList.securityName == securityName){
                    return this.stockList.wkn
                }
            }
        }
        if(securityName == undefined){ 
            for(var temp=0; temp<this.stockList.length; temp++){
                if(this.stockList.isin == isin){
                    return this.stockList.wkn
                }
            }
        }
    }
    //TODO: This function hast to be checked
    getAvailableSecurityLot(isin, wkn){
        var lot = 0;
        if(isin==undefined){
            for(var temp=0; temp<this.depot_table.length; temp++){
                if(this.depot_table[temp].wkn == wkn){
                    lot = lot + this.depot_table[temp].lot
                }
            }
        }
        if(wkn == undefined){
            for(var temp=0; temp<this.depot_table.length; temp++){
                if(this.depot_table[temp].isin == isin){
                    lot = lot + this.depot_table[temp].lot
                }
            }
        }
        return lot;
    }
    
    isinExists(isin){
        var isinFound = undefined;
        if(this.stockList != undefined && this.stockList.length > 0){
            this.stockList.find(element =>{
                if(element.isin == isin){isinFound = true}
            });
        }
        if(isinFound != undefined){
            return true;
        }else{
            return false;
        }
    }
    //TODO: This function hast to be checked
    getStockList(){
        var titels = []
        if(this.depot_table!=undefined){
            this.depot_table.forEach(element => {
                if(!titels.includes(element.securityName)){
                    titels.push(element.securityName);
                }
            });
        }        
        return titels;                
    }
    //TODO: This function hast to be checked
    withdrawValuesFromDepot(amount, costs, withdrawDate){
        
        var columns = 'depot_name, old_depot_amount, amount_to_withdraw, costs, withdraw_date, insert_date, insert_time';
        var values = [];
        values.push("'"+this.depotName+"'"); //depot name
        //depot current amount
        if(this.currentDepotValue==0){
            values.push(0);
        }else{
            
            values.push(this.currentDepotValue); 
        }
        values.push(parseFloat(amount)); //new amount to add to
        values.push(parseFloat(costs)); //costs for adding new amount to depot
        values.push("'"+withdrawDate+"'"); // date of amount deposit
        values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
        values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now           
        var query = `INSERT INTO withdrawDeposit (`+columns+`) VALUES(`+values.toString()+`)`.toString();    
        this.currentDepotValue = this.currentDepotValue - parseFloat(amount) - parseFloat(costs);
        let queryFinished = insertRowToDB(query).then(function(value){
            if(value==true){

                alert('Amount withdrawn from depot.');
                return new Promise((resolve)=>{
                    resolve(true);
                });
            }else{
                alert(value);
                return new Promise((reject)=>{
                    reject(value.message);
                })
            }
        });
        queryFinished.then(resolve=>this.updateDepotValueInDB())

    }
    
    //TODO: This function hast to be checked
    addValuesToDepot(newAmount, costs, deposit_date){        
        var columns = 'depot_name, old_depot_amount, new_value_to_add, costs, deposit_date, insert_date, insert_time';
        var values = [];
        values.push("'"+this.depotName+"'"); //depot name
        //depot current amount
        if(this.currentDepotValue==0){
            values.push(0);
        }else{
            
            values.push(this.currentDepotValue); 
        }
        values.push(parseFloat(newAmount)); //new amount to add to
        values.push(parseFloat(costs)); //costs for adding new amount to depot
        values.push("'"+deposit_date+"'"); // date of amount deposit
        values.push("'"+new Date().toISOString().replace('T', ' ').substr(0, 10)+"'"); //date part of today
        values.push("'"+new Date().toISOString().replace('T', ' ').substr(11)+"'"); //time of now           
        var query = `INSERT INTO addValues (`+columns+`) VALUES(`+values.toString()+`)`.toString();
    
        this.currentDepotValue = this.currentDepotValue+parseFloat(newAmount) - parseFloat(costs);
        
        let queryFinished = insertRowToDB(query).then(function(value){
            if(value==true){

                alert('Values added to depot.');
                return new Promise((resolve)=>{
                    resolve(true);
                });
            }else{
                alert(value);
                return new Promise((reject)=>{
                    reject(value.message);
                })
            }
        });
        queryFinished.then(resolve=>this.updateDepotValueInDB())
    }
    //TODO: This function hast to be checked
    updateDepotValueInDB(){   

        console.log(this.currentDepotValue); 
        var query = `Update depot set current_depot_value =`+ this.currentDepotValue + ` where depot_name = '`+ this.depotName+ `' and insert_time = '`+this.insertTime+`' and insert_date = '`+this.insertDate+`'`
        UpdateRowToDB(query);
    }

    getNumberOfCurrentStocks(){
        if(this.stockList.length>0) return this.stockList.length
        else return 0
    }
    getTotalDepotValue(){
        if(this.stockList.length>0) {
            var value = this.currentDepotValue;
            this.stockList.forEach(element => {
                value = value + (element.lot * element.buyingPrice)
            })
            return value;
        }
        else return this.currentDepotValue;
    }
    getSecurityBuyingDate(isin, buyingPrice, lot){
        if(this.stockList.length >= 0){
            this.stockList.find(element =>{
                if(element.isin == isin && element.buyingPrice == buyingPrice && element.lot == lot){
                    return element.buyingDate;
                }
            })
        }else{
            return undefined;
        }
    }

}
//update database
//This inserts a new row to database 
async function UpdateRowToDB(query){
    await dbQuery.open('./db/app.db')
    result = await dbQuery.run(query);
    dbQuery.close();
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

exports.Stock = class Stock{
    constructor(isin, securityName, lot, buyingPrice, buyingCost, buyingDate, insertTime){
        this.isin = isin;
        this.securityName = securityName;
        this.lot = lot;
        this.buyingPrice = buyingPrice;
        this.buyingCost = buyingCost;
        this.buyingDate = buyingDate;
        this.insertTime = insertTime;
    }
}
