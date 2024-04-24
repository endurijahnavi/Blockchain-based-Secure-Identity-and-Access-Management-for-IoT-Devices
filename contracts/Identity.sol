// SPDX-License-Identifier: MIT
pragma solidity >=0.5.2;

contract Identity {
    struct Device {
        string uniqueId;
        string deviceName;
        string deviceType;
        address currentOwner;
        address[] pastOwners;
        bool isRegistered;
        bool stolen;
    }

    mapping(string => Device) public devices;

    event DeviceRegistered(string uniqueId, string deviceName, string deviceType, address owner);
    event DeviceTransferred(string uniqueId, address previousOwner, address newOwner);
    event DeviceStolen(string uniqueId);

    function register(string calldata _uniqueId, string calldata _deviceName, string calldata _deviceType) external {
        require(!devices[_uniqueId].isRegistered, "Device already registered");
        devices[_uniqueId] = Device(_uniqueId, _deviceName, _deviceType, msg.sender, new address[](0), true, false);
        emit DeviceRegistered(_uniqueId, _deviceName, _deviceType, msg.sender);
    }

    function transferOwnership(string calldata _uniqueId, address _newOwner) external {
        require(devices[_uniqueId].isRegistered, "Device not registered");
        
        devices[_uniqueId].pastOwners.push(devices[_uniqueId].currentOwner);
        emit DeviceTransferred(_uniqueId, devices[_uniqueId].currentOwner, _newOwner);
        devices[_uniqueId].currentOwner = _newOwner;
    }

    function updateStolenStatus(string calldata _uniqueId) external {
        devices[_uniqueId].stolen = true;
        emit DeviceStolen(_uniqueId);
    }

    function getCurrentOwner(string calldata _uniqueId) external view returns (address) {
        return devices[_uniqueId].currentOwner;
    }

    function getPastOwners(string calldata _uniqueId) external view returns (address[] memory) {
        return devices[_uniqueId].pastOwners;
    }

    function isDeviceStolen(string calldata _uniqueId) external view returns (bool) {
        return devices[_uniqueId].stolen;
    }
}
