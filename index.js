import express from 'express';
const app = express()
const port = 3000
import { exec } from 'child_process';
import fs from 'fs';
import Web3 from 'web3';
const web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:8545"));

let [verAddress , genAddress] = fs.readFileSync("./address.txt").toString().split("\n")
console.log(verAddress);
console.log(genAddress);

app.use(express.json());

let verContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./verifierZKP/compiled/verifier_sol_Verifier.abi').toString()), verAddress)
let genContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./generatorZKP/compiled/verifier_sol_Verifier.abi').toString()), genAddress)

app.post('/verify', function(req, res) {
    let input = req.body.input
    let result = exec('cd verifierZKP && zokrates compute-witness -a ' + input.map(x => x.toString()).join(" ") + '&& zokrates generate-proof', async function(error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        let proof = JSON.parse(fs.readFileSync('./verifierZKP/proof.json').toString())
        let accounts = await web3.eth.getAccounts();
        let result = await verContract.methods.verifyTx({
            a : {
                X : (proof.proof.a[0]),
                Y : (proof.proof.a[1])
            },
            b : {
                X : [proof.proof.b[0][0], proof.proof.b[0][1]],
                Y : [proof.proof.b[1][0], proof.proof.b[1][1]]
            },
            c : {
                X : proof.proof.c[0],
                Y : proof.proof.c[1]
            },
        }).call({
            from: accounts[0],
        })
        console.log(result);
        res.send(result)
        fs.unlinkSync('./verifierZKP/proof.json')
    })
  
});

app.post('/generate', async function(req, res) {
    let input = req.body.input
    let result = exec('cd generatorZKP && zokrates compute-witness -a ' + input.join(" ") + ' && zokrates generate-proof', async function(error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        console.log(stdout);
        let priv = fs.readFileSync('./generatorZKP/witness').toString().split("\n").slice(0, 2).map(x => x.split(" ")[1]).reverse()
        let proof = JSON.parse(fs.readFileSync('./generatorZKP/proof.json').toString())
        let accounts = await web3.eth.getAccounts();
        let result = await genContract.methods.verifyTx({
            a : {
                X : (proof.proof.a[0]),
                Y : (proof.proof.a[1])
            },
            b : {
                X : [proof.proof.b[0][0], proof.proof.b[0][1]],
                Y : [proof.proof.b[1][0], proof.proof.b[1][1]]
            },
            c : {
                X : proof.proof.c[0],
                Y : proof.proof.c[1]
            },
        }).call({
            from: accounts[0],
        })
        if (result == true) {
            res.send(priv)    
        }
        else {
            res.send("error")
        }
        fs.unlinkSync('./generatorZKP/witness')
    })
  
})

app.listen(port, async () => { 
    console.log('Example app listening on port %s!',port)
})