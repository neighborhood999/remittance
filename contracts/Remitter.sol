pragma solidity ^0.4.24;

import "./Ownable.sol";

contract Remitter is Ownable {
    uint constant ONE_YEAR_OF_BLOCKS = 365 * 86400 / 15;

    struct Remittance {
        address exchanger;
        uint balance;
        uint lastBlock;
    }

    mapping(bytes32 => Remittance) public remittances;

    event LogSendFund(
        address indexed sender,
        address indexed exchanger,
        bytes32 passwordHash,
        uint balance,
        uint lastBlock
    );
    event LogWithdraw(address indexed from, uint balance);

    function generatePasswordHash(
        address exchanger,
        bytes32 password1,
        bytes32 password2
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(this, exchanger, password1, password2));
    }

    function sendFund(
        address exchanger,
        bytes32 passwordHash,
        uint blockDuration
    ) public payable returns (bool) {
        Remittance storage remittance = remittances[passwordHash];

        require(msg.value > 0, "msg.value should be greater than 0");
        require(exchanger != address(0), "exchanger address can't equals 0");
        require(remittance.balance == 0, "remittances balance should be equals 0");
        require(blockDuration > 0, "block duration should be less than 0");
        require(
            blockDuration <= ONE_YEAR_OF_BLOCKS,
            "block duration should be less than the 2,102,400"
        );

        uint lastBlock = block.number + blockDuration;

        remittance.exchanger = exchanger;
        remittance.balance = msg.value;
        remittance.lastBlock = lastBlock;

        emit LogSendFund(msg.sender, exchanger, passwordHash, msg.value, blockDuration);

        return true;
    }

    function withdraw(
        bytes32 password1,
        bytes32 password2
    ) public returns (bool) {
        bytes32 passwordHash = generatePasswordHash(
            msg.sender,
            password1,
            password2
        );
        Remittance storage remittance = remittances[passwordHash];

        uint balance = remittance.balance;
        require(balance > 0, "Balance must greater than 0");

        remittance.exchanger = address(0);
        remittance.balance = 0;
        remittance.lastBlock = 0;

        emit LogWithdraw(msg.sender, balance);
        msg.sender.transfer(balance);

        return true;
    }
}
