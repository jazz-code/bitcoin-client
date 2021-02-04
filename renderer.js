// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const {dialog, BrowserWindow} = require('electron').remote

const {
    getHowManyBtcCanIBuy,
    getTotalPriceOfBtcAmount,
    refreshRealData
} = require('./utils')


const Client = require('coinbase').Client;

const client = new Client({ 'apiKey': '<apiKey>', 'apiSecret': '<apiSecret>'}) 

// HTML elements
let currentBtcPriceElement = document.getElementById('current-btc-price');

let userBalanceFiatElement = document.getElementById('user-balance-fiat');
let userBalanceBtcElement = document.getElementById('user-balance-btc');

let inputAmountFiatElement = document.getElementById('input-amount-fiat');
let fiatCurrencyElement = document.getElementById('fiat-currency');

let inputAmountBtcElement = document.getElementById('input-amount-btc');

let buyBtnElement = document.getElementById('buy-btn');
let sellBtnElement = document.getElementById('sell-btn');
let estimatedAmountElement = document.getElementById('estimated-amount');

// Important: Change it to false when you want to use your real account from Coinbase
const useSandboxMode = true;
const fakeBTCPrice = 30000;
// Important: Depending on the currency you use in Coinbase, you need to select either 'EUR' or 'USD' (or any other valid one)
let fiatCurrency = 'USD';

let currentBalanceFiat = useSandboxMode ? 5000 : 0;
let currentBalanceBtc = useSandboxMode ? 3 : 0;

buyBtnElement.addEventListener('click', (event) => {
        /*
    After clicking the "Buy" button we would like to buy BTCs. The amount is going to be defined
    by the number of Fiat that we specify in the input.
    */
   let successfulDialog = (btcAmount) => {
       let options = {
           type: 'info',
           title: 'Thanks!',
           message: `You bought ${btcAmount} BTC!`
       }
       dialog.showMessageBox(options)
   }
   let failureDialog = (message) => {
       let options = {
           type: 'error',
           title: 'Error',
           message: message
       }
       dialog.showMessageBox(options)
   }

   let money = parseFloat(inputAmountFiatElement.value);
   if (!money) {
       failureDialog('Invalid value!')
       return
   }
   getHowManyBtcCanIBuy(client, fiatCurrency, money, useSandboxMode, fakeBTCPrice).then((btcAmount) => {
       if (useSandboxMode) {
           if (money > currentBalanceFiat) {
            failureDialog('Sorry! You don\'t have enough money in your account!');
            return
        }
        successfulDialog(btcAmount);
        // Update the 'fake' balances
        currentBalanceFiat -= money;
        currentBalanceBtc += btcAmount;
        userBalanceFiatElement.innerHTML = 'Balance ' + fiatCurrency + ': ' + currentBalanceFiat + ' ' + fiatCurrency;
        userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' BTC';
        
       } else {
           client.getAccounts({}, (err, accounts) => {
               accounts.forEach((acct) => {
                   if (acct.type === 'fiat' && acct.currency === 'fiatCurrency') {
                       currentBalanceFiat = parseFloat(acct.balance.amount)

                       if (money > currentBalanceFiat) {
                        failureDialog('Sorry! You don\'t have enough money in your account!');
                        return;
                    }

                    let args = {
                        "amount": btcAmount.toString(),
                        "currency": "BTC",
                    };
                    
                    acct.buy(args, (err, txn) => {
                        if (!err) {
                            successfulDialog(btcAmount)
                            // Update 'real' balances
                            refresh();
                        } else {
                            failureDialog(err.message);
                        }
                    })
                   }
               })
           })
       }
   })
})

sellBtnElement.addEventListener('click', function (event) {
    /*
    After clicking the "Sell" button we would like to sell BTCs.
    */

    let successfulDialog = function (btcAmount) {
        let options = {
            type: 'info',
            title: 'Thanks!',
            message: 'You sold ' + btcAmount + ' BTC'
        }
        dialog.showMessageBox(options)
    }
    let failureDialog = function (message) {
        let options = {
            type: 'error',
            title: 'Error',
            message: message
        }
        dialog.showMessageBox(options)
    }

    let btcAmount = parseFloat(inputAmountBtcElement.value);
    if (!btcAmount) {
        failureDialog('Invalid value!');
        return;
    }

    getTotalPriceOfBtcAmount(client, fiatCurrency, btcAmount, useSandboxMode, fakeBTCPrice).then(function (price) {
        if (useSandboxMode) {
            if (btcAmount > currentBalanceBtc) {
                failureDialog('Sorry! You don\'t have enough BTC in your account!');
                return;
            }
            successfulDialog(btcAmount);
            // We update the "fake" balances
            currentBalanceFiat += price;
            currentBalanceBtc -= btcAmount;
            userBalanceFiatElement.innerHTML = 'Balance ' + fiatCurrency + ': ' + currentBalanceFiat + ' ' + fiatCurrency;
            userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' BTC';
        } else {
            client.getAccounts({}, function (err, accounts) {
                accounts.forEach(function (acct) {
                    if (acct.type === 'wallet' && acct.currency === 'BTC') {
                        currentBalanceBtc = parseFloat(acct.balance.amount);

                        if (btcAmount > currentBalanceBtc) {
                            failureDialog('Sorry! You don\'t have enough BTC in your account!');
                            return;
                        }

                        let args = {
                            "amount": btcAmount.toString(),
                            "currency": "BTC",
                        };
                        acct.sell(args, function (err, txn) {
                            if (!err) {
                                successfulDialog(btcAmount);
                                // We update the "real" balances
                                refresh();
                            } else {
                                failureDialog(err.message);
                            }
                        });
                    }
                });
            });
        }
    })
});

inputAmountFiatElement.addEventListener('keyup', (event) => {
        /*
    While typing a certain fiat amount in the input, we would like to know how many BTC that results
    */
   let money = parseFloat(event.target.value);
   if (!money) {
       estimatedAmountElement.innerHTML = '';
       return;
   }
   getHowManyBtcCanIBuy(client, fiatCurrency, money, useSandboxMode, fakeBTCPrice).then(function (price) {
       estimatedAmountElement.innerHTML = money + ' ' + fiatCurrency + ' = ' + price + ' BTC';
   });

   inputAmountBtcElement.addEventListener('keyup', (event) => {
           /*
    While typing a certain BTC amount in the input, we would like to know how much fiat that results
    */
    let btcAmount = parseFloat(event.target.value);
    if (!btcAmount) {
        estimatedAmountElement.innerHTML = '';
        return;
    }
    getTotalPriceOfBtcAmount(client, fiatCurrency, btcAmount, useSandboxMode, fakeBTCPrice).then(function (price) {
        estimatedAmountElement.innerHTML = btcAmount + ' BTC = ' + price + ' ' + fiatCurrency;
    });
   })
})

function refresh() {
    refreshRealData(
        client,
        fiatCurrency,
        userBalanceBtcElement,
        userBalanceFiatElement,
        currentBtcPriceElement,
        estimatedAmountElement,
        currentBalanceBtc,
        currentBalanceFiat
    )
}

// Init code

// Set Currency in the UI
fiatCurrencyElement.innerHTML = ' ' + fiatCurrency;

if (useSandboxMode) {
    userBalanceFiatElement.innerHTML = 'Balance Fiat: ' + currentBalanceFiat + ' ' + fiatCurrency;
    userBalanceBtcElement.innerHTML = 'Balance BTC: ' + currentBalanceBtc + ' BTC';
    currentBtcPriceElement.innerHTML = '(Price: ' + fakeBTCPrice + ' ' + fiatCurrency + ')';
} else {
    refresh();
    
    // Refresh data each 30 seconds
    setInterval(function () {
        refresh();
    }, 30000);
}