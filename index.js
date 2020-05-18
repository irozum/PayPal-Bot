const express = require('express');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport')
const fetch = require("node-fetch");

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
        api_key: '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'
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

const checkRate = async () => {
  const rateToday = await getUSDCAD();
  const rateYesterday = await getUSDCAD(false);
  console.log(`Yestrday date: ${yesterdayDate()}`)
  console.log(`Yesterday: ${rateYesterday}, today: ${rateToday}`);
  if (rateToday < rateYesterday) {
    sendEmail('Transfer money', 'Time to transfer money from PayPal.');
  }
}

checkRate();


const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`App has been connected to the port ${PORT}`))