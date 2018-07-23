//importing inquirer package;
let inquirer = require('inquirer');
//importing mysql package;
let mysql = require('mysql');
//importing CLI Table to display products
let Table = require('cli-table');
//creating connection variable to get access to database on the server
let pool = mysql.createPool(
    {
        connectionLimit: 100,
        host: 'localhost',
        post: '3306',
        user: 'root',
        password: 'root',
        database: 'bamazon',
        multipleStatements: true,
    }
);
pool.getConnection(function(err,connection){
    if (err) throw err;
//Creating a query to read all the products data from the DB & display it in table upon start of the app. 
connection.query('SELECT * FROM products WHERE item_id IS NOT NULL',function(err,res){
    //CLI-TABLE reference to create new Table object with headers ('ID, Product Name, Price') and col-widths.
    let table = new Table(
        {
            head: ['Product ID', 'Product','Price'],
            colWidths: [10,50,20]
        },
    );
    //Loop through an array of objects pulled from DB to display each products id, name and it's price
    for (let i = 0; i < res.length; i++){
        table.push(
            [`${res[i].item_id}`,`${res[i].product_name}`,`$${res[i].price}`],
        ); 
    };

    //Display welcome message to the customer that makes them buy from Bamazon.
        //App displays all items for sale with prices
    console.log('WELCOME TO BAMAZON! PLEASE BUY SOMETHING BECAUSE I HAVE A CHILD TO FEED. --- NO PRESSURE! '+ '\n'+table.toString());
    //Creating the list of IDs that customer can choose when picking items to buy
    let choiceArray = res.map(listChoices);
    //function to return choices(item_id's) converting to string type as elements of new array
    function listChoices(value){
        return value.item_id.toString();
    };
    // console.log(choiceArray);
    inquirer.prompt([
        {
            type:'list',
            name:'id',
            message: "Select the item's Id that you wish to buy! Don't be cheap! Please buy the most expensive items!",
            choices: choiceArray,
        },
        {
            type:'input',
            name:'qty',
            message: "How many would you like to buy?",
        },
    ]).then (function(custSelection){
        let itemNum = [parseInt(custSelection.id)];
        let itemQty = custSelection.qty;
        // console.log('Customer picked this item#: '+itemNum);
        // console.log("He/She wants to get this much of it's qty: "+itemQty);
        connection.query('SELECT product_name,price,stock_qty FROM products WHERE item_id = ?',itemNum,function(err,sysRes){
            let dbProdName = sysRes[0].product_name;
            let dbProdPrice = sysRes[0].price;
            let dbProdStock = sysRes[0].stock_qty;
            // console.log(dbProdName);
            // console.log(`$${dbProdPrice}`);
            // console.log(dbProdStock);
            if (itemQty <= dbProdStock) {
                console.log(`Your order will be complete based on the stock qty.\n Your total cost is $${itemQty*dbProdPrice}.`);
                //fullfill the order 
                inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmOrder',
                        message: 'Are you sure you want to proceed to checkout charging your credit card?'
                    }
                ]).then(function(confirmOrder){
                    if(confirmOrder.confirmOrder){
                        connection.query(`UPDATE products SET stock_qty = ${dbProdStock-itemQty} WHERE item_id = ${itemNum}`,function(err,completeOrder){
                            console.log('Thank You for your purchase! My child will be fed now!');
                            //terminating App connection
                            connection.destroy();
                        });
                    } else {
                        console.log('I knew you were not going to buy!');
                        //terminating App connection
                        connection.destroy();
                    }
                });
            } else if (itemQty > dbProdStock) {
                console.log('Sorry we cannot complete your order due to insufficient stock qty.');
                connection.destroy();
            }
            if(err) throw err;
            });
        });
    //Release pooling connections 
    connection.release();
    if(err) throw err;
    });
});









// Then create a Node application called bamazonCustomer.js. Running this application will first display all of the items available for sale. Include the ids, names, and prices of products for sale.

// The app should then prompt users with two messages.

// The first should ask them the ID of the product they would like to buy.
// The second message should ask how many units of the product they would like to buy.
// Once the customer has placed the order, your application should check if your store has enough of the product to meet the customer's request.

// If not, the app should log a phrase like Insufficient quantity!, and then prevent the order from going through.
// However, if your store does have enough of the product, you should fulfill the customer's order.

// This means updating the SQL database to reflect the remaining quantity.
// Once the update goes through, show the customer the total cost of their purchase.