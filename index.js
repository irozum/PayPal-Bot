const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: ".env" })
const sgTransport = require('nodemailer-sendgrid-transport')
const fetch = require("node-fetch");
const Paypal = require('paypal-nvp-api');

app = express();

app.get('/', (req, res) => {
  return res.send('hello');
})

const sendEmail = (subject, text) => {
  const email = {
    to: 'farkop69@gmail.com',
    from: 'exrBot@email.com',
    fromname: 'Exchange Rates Bot',
    subject,
    text
  };
  
  const options = {
    auth: {
        api_key: process.env.SG_KEY
    }
  }
  const mailer = nodemailer.createTransport(sgTransport(options));   
  
  mailer.sendMail(email, (err, res)=>{
    if (err) console.log(err);
  })
};

const yesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return JSON.stringify(date).substr(1, 10);
}

const getUSDCAD = async (latest = true) => {
  const date = latest ? 'latest' : yesterdayDate();
  const url = `https://api.exchangeratesapi.io/${date}?base=USD`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.rates.CAD.toFixed(3);
  } catch (e) {
    console.log('Fetch failed' + e);
    sendEmail('Exchange bot error', e);
  }
};

const getPPBalance = async () => {
  const config = {
    mode: 'live',
    username: process.env.PP_USERNAME,
    password: process.env.PP_PASSWORD,
    signature: process.env.PP_SIGNATURE
  }
  
  try {
    const paypal = Paypal(config);
    const result = await paypal.request('GetBalance', {});
    return result.L_AMT0;
  } catch (e) {
    console.log('PayPal connection failed: ' + e);
    sendEmail('PayPal connection failed', e);
  }
}

const checkRate = async () => {
  const PayPalBalance = await getPPBalance();
  if (PayPalBalance > 0) {
    const rateToday = await getUSDCAD();
    const rateYesterday = await getUSDCAD(false);
    console.log(`Yestrday date: ${yesterdayDate()}`)
    console.log(`Yesterday: ${rateYesterday}, today: ${rateToday}`);
    if (rateToday < rateYesterday) {
      sendEmail('Transfer money', 'Time to transfer money from PayPal.');
    }
  }
}

checkRate();


const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`App has been connected to the port ${PORT}`))