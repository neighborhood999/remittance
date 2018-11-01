import { expect } from 'chai';
import { BigNumber } from 'bignumber.js';
import web3Utils from 'web3-utils';
import { default as Promise } from 'bluebird';
import expectedException from '../utils/expectedException';

const Remitter = artifacts.require('Remitter');

const logEvent = ({ logs: [log] }) => log;

if (typeof web3.eth.getBlockPromise !== 'function') {
  Promise.promisifyAll(web3.eth, { suffix: 'Promise' });
}

contract('Remitter', accounts => {
  const [alice, bob, carol] = accounts;
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

      await expectedException(
        () => remitter.sendFund(bob, passwordHash, 1, { from: alice, value }),
        3000000
      );
    });

    it('should fail if exchanger address equals address(0)', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await expectedException(
        () => remitter.sendFund('0x0', passwordHash, 1, { from: alice, value }),
        3000000
      );
    });

    it('should fail if remittance balance not equals 0', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      await expectedException(
        () =>
          remitter.sendFund(bob, passwordHash, 2, {
            from: alice,
            value
          }),
        3000000
      );
    });

    it('should fail if duration equals 0', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await expectedException(
        () =>
          remitter.sendFund(bob, passwordHash, 0, {
            from: alice,
            value
          }),
        3000000
      );
    });

    it('should fail if last block greater than 2102400', async () => {
      const value = web3.toWei('0.1', 'ether');

      await expectedException(
        () =>
          remitter.sendFund(bob, passwordHash, 2102401, {
            from: alice,
            value
          }),
        3000000
      );
    });

    it('should receive ether from remittance', async () => {
      const value = web3Utils.toWei('0.1', 'ether');
      const remittanceBefore = await remitter.remittances(passwordHash);

      expect(remittanceBefore[1].toString(10)).to.not.equal(value.toString(10));

      const tx = await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });
      const remittanceAfter = await remitter.remittances(passwordHash);
      const log = logEvent(tx);

      expect(log.event).to.equal('LogSendFund');
      expect(log.args.sender).to.equal(alice);
      expect(log.args.exchanger).to.equal(bob);
      expect(log.args.passwordHash).to.equal(passwordHash);
      expect(log.args.balance.toString(10)).to.equal(value.toString(10));
      expect(remittanceAfter[1].toString(10)).to.equal(value.toString(10));
    });
  });

  describe('withdraw function', () => {
    it('should fail if remittance balances is empty', async () => {
      await expectedException(
        () =>
          remitter.withdraw(bobPassword, carolPassword, {
            from: bob
          }),
        3000000
      );
    });

    it('should fail if password equals empty', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      await expectedException(
        () => remitter.withdraw('', carolPassword, { from: bob }),
        3000000
      );
      await expectedException(
        () => remitter.withdraw(bobPassword, '', { from: bob }),
        3000000
      );
    });

    it('should receive ether by bob withdraw', async () => {
      const value = web3Utils.toWei('0.1', 'ether');

      await remitter.sendFund(bob, passwordHash, 1, {
        from: alice,
        value
      });

      const remittanceBefore = await remitter.remittances(passwordHash);
      expect(remittanceBefore[1].toString(10)).to.equal(value.toString(10));

      const tx = await remitter.withdraw(bobPassword, carolPassword, {
        from: bob
      });
      const log = logEvent(tx);
      const remittanceAfter = await remitter.remittances(passwordHash);

      expect(log.event).to.equal('LogWithdraw');
      expect(log.args.from).to.equal(bob);
      expect(log.args.balance.toString(10)).to.equal(value.toString(10));
      expect(BigNumber(remittanceAfter[0]).toString(10)).to.equal('0');
      expect(remittanceAfter[1].toString(10)).to.equal('0');
      expect(remittanceAfter[2].toString(10)).to.equal('0');
    });
  });
});
