import Web3 from 'web3';
import { exec, execSync } from 'child_process';
import fs from 'fs';
const web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:8545"));



execSync('cd verifierZKP && zokrates compile -i verifier.zok && zokrates setup && zokrates export-verifier && solcjs verifier.sol --bin --abi -o ./compiled', function(error, stdout, stderr) {
    if (error !== null) {
         console.log('exec error: ' + error);
    }
})
execSync('cd generatorZKP && zokrates compile -i generator.zok && zokrates setup && zokrates export-verifier && solcjs verifier.sol --bin --abi -o ./compiled', function(error, stdout, stderr) {
    if (error !== null) {
         console.log('exec error: ' + error);
    }
})

let verbytecode=fs.readFileSync('./verifierZKP/compiled/verifier_sol_Verifier.bin').toString()
let verabi=fs.readFileSync('./verifierZKP/compiled/verifier_sol_Verifier.abi').toString()
let genbytecode=fs.readFileSync('./generatorZKP/compiled/verifier_sol_Verifier.bin').toString()
let genabi=fs.readFileSync('./generatorZKP/compiled/verifier_sol_Verifier.abi').toString()

let verContract = new web3.eth.Contract(JSON.parse(verabi))
let genContract = new web3.eth.Contract(JSON.parse(genabi))

async function init() {
    
const accounts = await web3.eth.getAccounts();
console.log(accounts);
verContract = await verContract.deploy({
    data : verbytecode
}).send({
    from : accounts[0],
    gas : 1500000,
    gasPrice : '30000000000000'
}
)
fs.writeFileSync("./address.txt" , verContract.options.address + "\n" ) 

genContract = await genContract.deploy({
    data : genbytecode
}).send({
    from : accounts[0],
    gas : 6721975,
    gasPrice : '2000000000'
})
fs.appendFileSync("./address.txt" , genContract.options.address )

fs.rmSync("./verifierZKP/compiled", { recursive: true, force: true });
fs.rmSync("./generatorZKP/compiled", { recursive: true, force: true });
fs.unlinkSync('./verifierZKP/verifier.sol')
fs.unlinkSync('./generatorZKP/verifier.sol')
// UNCOMMENT BEFORE PRODUCTION
// fs.unlinkSync('./verifierZKP/verifier.zok')
// fs.unlinkSync('./generatorZKP/generator.zok')
fs.unlinkSync('./verifierZKP/abi.json')
fs.unlinkSync('./generatorZKP/abi.json')
fs.unlinkSync("./verifierZKP/proving.key")
fs.unlinkSync("./verifierZKP/verification.key")
fs.unlinkSync("./generatorZKP/proving.key")
fs.unlinkSync("./generatorZKP/verification.key")

}

init()


