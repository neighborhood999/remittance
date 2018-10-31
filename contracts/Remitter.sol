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
        string password1,
        string password2
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(exchanger, password1, password2));
    }

    function sendFund(
        address exchanger,
        bytes32 passwordHash,
        uint blockDuration
    ) public payable returns (bool) {
        require(msg.value > 0, "msg.value should be greater than 0");
        require(exchanger != address(0), "exchanger address can't equals 0");
        require(remittances[passwordHash].balance == 0, "remittances balance should be equals 0");
        require(blockDuration > 0, "block duration should be less than 0");
        require(
            blockDuration <= ONE_YEAR_OF_BLOCKS,
            "block duration should be less than the 2,102,400"
        );

        uint lastBlock = block.number + blockDuration;

        remittances[passwordHash].exchanger = exchanger;
        remittances[passwordHash].balance = msg.value;
        remittances[passwordHash].lastBlock = lastBlock;

        emit LogSendFund(msg.sender, exchanger, passwordHash, msg.value, blockDuration);

        return true;
    }

    function withdraw(
        string password1,
        string password2
    ) public returns (bool) {
        require(bytes(password1).length != 0, "password1 is required");
        require(bytes(password2).length != 0, "password2 is required");
        require(balance > 0, "Nothing to withdraw, balance equals 0");

        bytes32 passwordHash = generatePasswordHash(
            msg.sender,
            password1,
            password2
        );
        uint balance = remittances[passwordHash].balance;

        remittances[passwordHash].balance = 0;
        emit LogWithdraw(msg.sender, balance);
        msg.sender.transfer(balance);

        return true;
    }
}
