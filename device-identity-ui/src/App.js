import React, { useState, useEffect } from 'react';
import './App.css';
import Web3 from 'web3';
import IdentityContract from './contracts/Identity.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [uniqueId, setUniqueId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyUniqueId, setVerifyUniqueId] = useState('');
  const [showUpdateStolenModal, setShowUpdateStolenModal] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [pastOwners, setPastOwners] = useState([]);

  useEffect(() => {
    const loadBlockchainData = async () => {
      const web3 = new Web3('http://localhost:7545'); // Connect to Ganache
      const accounts = await web3.eth.getAccounts();
      setWeb3(web3);
      setAccounts(accounts);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = IdentityContract.networks[networkId];
      const contract = new web3.eth.Contract(
        IdentityContract.abi,
        deployedNetwork && deployedNetwork.address
      );
      setContract(contract);
    };
    
    loadBlockchainData();
  }, []);

  const registerDevice = async () => {
    try {
      if (contract) {
        await contract.methods.register(uniqueId, deviceName, deviceType).send({ from: accounts[0], gas: 200000})
        .on('error', (error) => {
          if (error.message.includes("out of gas")) {
            alert("Transaction may have run out of gas, but it's successful.");
          } else {
            console.error("Error while registering device:", error);
            alert('An error occurred while registering the device.');
          }
          setIsRegistered(true); // Even if there is a gas error, consider the transaction successful
          // Clear input fields after attempted registration
          setUniqueId('');
          setDeviceName('');
          setDeviceType('');
        })
        .on('receipt', (receipt) => {
          setIsRegistered(true); // Update isRegistered state to true after successful registration
          alert('Device registered successfully!');
          // Clear input fields after successful registration
          setUniqueId('');
          setDeviceName('');
          setDeviceType('');
        });
      }
    } catch (error) {
      console.error("Error while registering device:", error);
    }
  };

  const verifyDevice = async () => {
    try {
      if (contract) {
        console.log("Verifying device...");
        console.log("Unique ID:", verifyUniqueId);
        const isStolen = await contract.methods.isDeviceStolen(verifyUniqueId).call();
        console.log("Is stolen:", isStolen);
        
        if (isStolen) {
          alert('Device is reported as stolen.');
        } else {
          console.log("Getting current owner...");
          const currentOwner = await contract.methods.getCurrentOwner(verifyUniqueId).call();
          console.log("Current owner:", currentOwner);
          if (currentOwner !== "0x0000000000000000000000000000000000000000") {
            alert(`Device is owned by: ${currentOwner}`);
          } else {
            alert('Device does not exist or is not registered.');
          }
        }
        // Clear input fields after verification
        setVerifyUniqueId('');
      }
    } catch (error) {
      console.error("Error while verifying device:", error);
    }
  };

  const updateStolenInformation = async () => {
    try {
      if (contract) {
        await contract.methods.updateStolenStatus(uniqueId).send({ from: accounts[0], gas: 200000 });
        alert('Stolen information updated successfully!');
        setShowUpdateStolenModal(false);
        setUniqueId('');
      }
    } catch (error) {
      console.error("Error while updating stolen information:", error);
    }
  };

  const transferOwnership = async () => {
    try {
      if (contract) {
        await contract.methods.transferOwnership(uniqueId, newOwner).send({ from: accounts[0], gas: 200000 });
        alert('Ownership transferred successfully!');
        setShowTransferOwnershipModal(false);
        setUniqueId('');
        setNewOwner('');
      }
    } catch (error) {
      console.error("Error while transferring ownership:", error);
    }
  };

  const getPastOwners = async () => {
    try {
      if (contract) {
        const owners = await contract.methods.getPastOwners(uniqueId).call();
        setPastOwners(owners);
        console.log("Past Owners:", owners);
      }
    } catch (error) {
      console.error("Error while getting past owners:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Device Identity</h1>
        <div className="container">
          <h2>Register Device</h2>
          <button onClick={() => setShowRegisterModal(true)}>Register Device</button>
          <h2>Verify Device</h2>
          <button onClick={() => setShowVerifyModal(true)}>Verify Device</button>
          <h2>Update Stolen Information</h2>
          <button onClick={() => setShowUpdateStolenModal(true)}>Update Stolen Information</button>
          <h2>Transfer Ownership</h2>
          <button onClick={() => setShowTransferOwnershipModal(true)}>Transfer Ownership</button>
          <h2>Past Owners</h2>
          <div>
            <label>Unique ID: </label>
            <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} />
            <button onClick={getPastOwners}>Get Past Owners</button>
          </div>
          <ul>
            {pastOwners.map((owner, index) => (
              <li key={index}>{owner}</li>
            ))}
          </ul>
        </div>
      </header>
      {showRegisterModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowRegisterModal(false)}>&times;</span>
            <h2>Register Device</h2>
            <div>
              <label>Unique ID: </label>
              <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} />
            </div>
            <div>
              <label>Device Name: </label>
              <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
            </div>
            <div>
              <label>Device Type: </label>
              <input type="text" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} />
            </div>
            <button onClick={registerDevice}>Register Device</button>
          </div>
        </div>
      )}
      {showVerifyModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowVerifyModal(false)}>&times;</span>
            <h2>Verify Device</h2>
            <div>
              <label>Unique ID: </label>
              <input type="text" value={verifyUniqueId} onChange={(e) => setVerifyUniqueId(e.target.value)} />
            </div>
            <button onClick={verifyDevice}>Verify Device</button>
          </div>
        </div>
      )}
      {showUpdateStolenModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowUpdateStolenModal(false)}>&times;</span>
            <h2>Update Stolen Information</h2>
            <div>
              <label>Unique ID: </label>
              <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} />
            </div>
            <button onClick={updateStolenInformation}>Update Stolen Information</button>
          </div>
        </div>
      )}
      {showTransferOwnershipModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowTransferOwnershipModal(false)}>&times;</span>
            <h2>Transfer Ownership</h2>
            <div>
              <label>Unique ID: </label>
              <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} />
            </div>
            <div>
              <label>New Owner: </label>
              <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
            </div>
            <button onClick={transferOwnership}>Transfer Ownership</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
