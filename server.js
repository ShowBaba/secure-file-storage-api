require('dotenv').config();
const express = require('express')
const app = express()
const routes = require('./routes')
const Web3 = require('web3');
const mongodb = require('mongodb').MongoClient
const contract = require('truffle-contract');
const artifacts = require('./build/Inbox.json');
app.use(express.json())

const blockNetworkAddress = '127.0.0.1:8545'

if (typeof web3 !== 'undefined') {
    // check if web3 is initialized
    var web3 = new Web3(web3.currentProvider)
} else {
      // initialize web3 on the given port
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
}
// build contract
const LMS = contract(artifacts);
LMS.setProvider(web3.currentProvider)

mongodb.connect(process.env.DB, { useUnifiedTopology: true }, async (err, client) => {
    const db = client.db('Cluster0')
    // get accounts
    const accounts = await web3.eth.getAccounts();
    // load account on local nodes
    const lms = await LMS.deployed();
    // for remote nodes deployed on ropsten or rinkeby use contract address directly
    //const lms = LMS.at(contract_address) 

    //home
    routes(app, db, lms, accounts)
    app.listen(process.env.PORT || 9000, () => {
        console.log('listening on port 9000');
    })
})
