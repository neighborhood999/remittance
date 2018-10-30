pragma solidity ^0.4.24;

contract Ownable {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(isOwner(), "Require Owner");
        _;
    }

    constructor() internal {
        _owner = msg.sender;

        emit OwnershipTransferred(address(0), _owner);
    }

    function owner() public view returns(address) {
        return _owner;
    }

    function isOwner() public view returns(bool) {
        return msg.sender == _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Owner address is required");

        emit OwnershipTransferred(_owner, newOwner);

        _owner = newOwner;
    }
}
