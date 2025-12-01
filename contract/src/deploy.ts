import 'dotenv/config';
import {
  Account,
  Args,
  Mas,
  SmartContract,
  JsonRpcProvider,
  MAX_GAS_EXECUTE,
} from '@massalabs/massa-web3';
import { getScByteCode } from './utils';

const account = await Account.fromEnv();
const rpcUrl = process.env.JSON_RPC_URL_PUBLIC;
const provider = rpcUrl
  ? JsonRpcProvider.fromRPCUrl(rpcUrl, account)
  : JsonRpcProvider.buildnet(account);

console.log('Deploying contract...');
console.log('Deployer address:', account.address.toString());
const infos = await provider.networkInfos();
console.log('Network:', infos.name, infos.url);
const balances = await provider.balanceOf([account.address.toString()]);
console.log('Deployer balance:', balances[0]?.balance?.toString?.());

const byteCode = getScByteCode('build', 'main.wasm');

const owner = account.address.toString();
const constructorArgs = new Args().addString(owner);

const contract = await SmartContract.deploy(
  provider,
  byteCode,
  constructorArgs,
  {
    coins: Mas.fromString('1'),
    maxGas: MAX_GAS_EXECUTE,
  },
);

console.log('Contract deployed at:', contract.address);

const events = await provider.getEvents({
  smartContractAddress: contract.address,
});

for (const event of events) {
  console.log('Event message:', event.data);
}
