// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
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