import { expect } from 'chai';
import { BigNumber } from 'bignumber.js';
import { default as Promise } from 'bluebird';
import expectedException from '../utils/expectedException';

const Remittance = artifacts.require('Remittance');

const logEvent = ({ logs: [log] }) => log;

if (typeof web3.eth.getBlockPromise !== 'function') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('Remittance', () => {
  // TODO:
});
