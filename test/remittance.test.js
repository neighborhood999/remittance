import { expect } from 'chai';
import { BigNumber } from 'bignumber.js';
import web3Utils from 'web3-utils';
import { default as Promise } from 'bluebird';
import expectedException from '../utils/expectedException';

const Remitter = artifacts.require('Remitter');

const getTxEvent1stLog = ({ logs: [log] }) => log;

if (typeof web3.eth.getBlockPromise !== 'function') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('Remitter', accounts => {
  const [alice, bob] = accounts;
  const bobPassword = 'bobPassword';
  const carolPassword = 'carolPassword';

  let remitter;
  let passwordHash;
  beforeEach('deploy new instance', async () => {
    remitter = await Remitter.new({ from: alice });
    passwordHash = await remitter.generatePasswordHash(
      bob,
      bobPassword,
      carolPassword
    );
  });

  describe('remittance function', () => {
    it('should fail if msg.value equals 0', async () => {
      const value = web3Utils.toWei('0', 'ether');

      await expectedException(() =>
        remitter.sendFund(bob, passwordHash, 1, { from: alice, value })
      );
    });

    it('should fail if exchanger address equals address(0)', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await expectedException(() =>
        remitter.sendFund('0x0', passwordHash, 1, { from: alice, value })
      );
    });

    it('should fail if remittance balance not equals 0', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      await expectedException(() =>
        remitter.sendFund(bob, passwordHash, 2, {
          from: alice,
          value
        })
      );
    });

    it('should fail if duration equals 0', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await expectedException(() =>
        remitter.sendFund(bob, passwordHash, 0, {
          from: alice,
          value
        })
      );
    });

    it('should fail if last block greater than 2102400', async () => {
      const value = web3.toWei('0.1', 'ether');

      await expectedException(() =>
        remitter.sendFund(bob, passwordHash, 2102401, {
          from: alice,
          value
        })
      );
    });

    it('should receive ether from remittance', async () => {
      const value = web3Utils.toWei('0.1', 'ether');
      const remittanceBefore = await remitter.remittances(passwordHash);

      expect(remittanceBefore[0].toString(10)).to.not.equal(value.toString(10));

      const tx = await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });
      const log = getTxEvent1stLog(tx);

      expect(log.event).to.equal('LogSendFund');
      expect(log.args.sender).to.equal(alice);
      expect(log.args.passwordHash).to.equal(passwordHash);
      expect(log.args.balance.toString(10)).to.equal(value.toString(10));

      const remittanceAfter = await remitter.remittances(passwordHash);

      expect(remittanceAfter[0].toString(10)).to.equal(value.toString(10));
    });
  });

  describe('withdraw function', () => {
    it('should fail if remittance balances is empty', async () => {
      await expectedException(() =>
        remitter.withdraw(bobPassword, carolPassword, {
          from: bob
        })
      );
    });

    it('should fail if password equals empty', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      await expectedException(() =>
        remitter.withdraw('', carolPassword, { from: bob })
      );
      await expectedException(() =>
        remitter.withdraw(bobPassword, '', { from: bob })
      );
    });

    it('should receive ether by bob withdraw', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      const remittanceBefore = await remitter.remittances(passwordHash);

      expect(remittanceBefore[0].toString(10)).to.equal(value.toString(10));

      const tx = await remitter.withdraw(bobPassword, carolPassword, {
        from: bob
      });
      const log = getTxEvent1stLog(tx);
      const remittanceAfter = await remitter.remittances(passwordHash);

      expect(log.event).to.equal('LogWithdraw');
      expect(log.args.from).to.equal(bob);
      expect(log.args.balance.toString(10)).to.equal(value.toString(10));
      expect(BigNumber(remittanceAfter[0]).toString(10)).to.equal('0');
      expect(remittanceAfter[0].toString(10)).to.equal('0');
      expect(remittanceAfter[1].toString(10)).to.equal('0');
    });
  });

  describe('Ownable', () => {
    it('should get contract owner', async () => {
      const bobGetContractOwner = await remitter.getOwner({ from: bob });

      expect(bobGetContractOwner).to.equal(alice);
    });

    it('should check contract owner is alice', async () => {
      const isOwner = await remitter.isOwner({ from: alice });

      expect(isOwner).to.equal(true);
    });

    it('should transfer ownership to bob', async () => {
      const tx = await remitter.transferOwnership(bob, { from: alice });
      const log = getTxEvent1stLog(tx);

      expect(log.event).to.equal('OwnershipTransferred');
      expect(log.args.previousOwner).to.equal(alice);
      expect(log.args.newOwner).to.equal(bob);

      const isOwner = await remitter.isOwner({ from: bob });

      expect(isOwner).to.equal(true);
    });
  });
});
