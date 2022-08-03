
require("dotenv").config();
const web3 = require("web3");
const {validate}= require('ethers-private');
var privKey = Buffer.from(process.env.PRIVATE_KEY, "hex");

const ethers = require('ethers');
const web3_WSS = new web3(process.env.WSS_PROVIDER);
const web3_HTTPS = new web3(process.env.HTTPS_PROVIDER);
const Tx = require("ethereumjs-transaction");
let txCount;
const { address } = web3_HTTPS.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

const routersABI = require("./src/artifacts/contracts/interfaces/routers.json");

const pairsABI = require("./src/artifacts/contracts/interfaces/pairs.json");
const factoriesABI = require("./src/artifacts/contracts/interfaces/factories.json");
const dex_addresses = require("./dex.json");
const pair_addresses = require("./pairs.json");
const factories = [];
const routers = [];


const runBot = async () => {
  txCount = await web3_HTTPS.eth.getTransactionCount(address);
  // txCount--;



  for (let i = 0; i < dex_addresses.length; i++) {
    const factory = new web3_HTTPS.eth.Contract(
      factoriesABI[i],
      dex_addresses[i].factory
    );
    factories.push(factory);
    const router = new web3_HTTPS.eth.Contract(
      routersABI[i],
      dex_addresses[i].router
    );
    routers.push(router);
  }
  if(!validate(process.env.PRIVATE_KEY)){
    print("Please put private key correctly!")
    return;
  }
  for (let i = 0; i < pair_addresses.length; i++) {
    const pairs = [], pairs_address = [];
    for (let k = 0; k < factories.length; k++) {
      try {
        const address_tmp = await factories[k].methods.getPair(pair_addresses[i]['token0'], pair_addresses[i]['token1']).call();
        const pair = new web3_HTTPS.eth.Contract(
          pairsABI[k],
          address_tmp
        );
        pairs.push(pair);
        pairs_address.push(address_tmp);        
      } catch (err) {
        pairs.push(null);
        pairs_address.push('');
      }
    }
    web3_WSS.eth.subscribe("newBlockHeaders")
      .on("data", async (event) => {
        let from_swap=0;
        let from_swap_id;
        for(let k=0;k<routers.length;k++){
          try{
            // console.log(ethers.utils.parseUnits(pair_addresses[i]['amount'].toString(10), pair_addresses[i]['decimal1']).toString());
            let amountIn=await routers[k].methods.getAmountsIn(ethers.utils.parseUnits(pair_addresses[i]['amount'].toString(10), pair_addresses[i]['decimal1']).toString(), [pair_addresses[i]['token0'], pair_addresses[i]['token1']]).call();
            const tmp_amountIn=Number(
              ethers.utils.formatUnits(amountIn[0], pair_addresses[i].decimal0)
            );
            if(from_swap==0){
              from_swap=tmp_amountIn;
              from_swap_id=k;
            }else if(from_swap>tmp_amountIn){
              from_swap=tmp_amountIn;
              from_swap_id=k;
            }
            console.log(amountIn[0]);
            // console.log('amountIn success '+k);            
          }catch(err){
            // console.log('amountIn fail '+k);
            // console.log(err);
          }
        }        
        let to_swap=0;
        let to_swap_id;
        for(let k=0;k<routers.length;k++){
          try{
            let amountOut=await routers[k].methods.getAmountsOut(ethers.utils.parseUnits(pair_addresses[i]['amount'].toString(10), pair_addresses[i]['decimal1']).toString(), [pair_addresses[i]['token1'], pair_addresses[i]['token0']]).call();
            const tmp_amountOut=Number(
              ethers.utils.formatUnits(amountOut[1], pair_addresses[i].decimal0)
            );
            if(to_swap==0){
              to_swap=tmp_amountOut;
              to_swap_id=k;
            }else if(to_swap<tmp_amountOut){
              to_swap=tmp_amountOut;
              to_swap_id=k;
            }
            console.log(amountOut[1]);
            // console.log(amountOut);
            // console.log('amountOut success '+k);
          }catch(err){
            // console.log('amountOut failed '+k);
          }
        }

        const arbitrage = to_swap - from_swap;
        if(to_swap!=0 && from_swap!=0){
          console.log("-------------------------------------------------------------------------------------------------------------------------------------");
          console.log(`Found ${pair_addresses[i].token1} Amount:`, pair_addresses[i]['amount'] + ` from ${dex_addresses[from_swap_id].router}`);
          console.log(`swap ${pair_addresses[i].token1} Amount:`, pair_addresses[i]['amount'] + ` to ${dex_addresses[to_swap_id].router}`);
  
          const shouldTrade = arbitrage >= pair_addresses[i]['profit'];
  
          console.log(`Expected profit : ` + arbitrage);
          console.log(`PROFITABLE? ${shouldTrade}`);
  
  
          
        }
        else{        
          console.log('there is no pool')
        }

      });
  }
};

console.log("Bot started!");

runBot();
