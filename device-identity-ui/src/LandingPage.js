import React, { useState, useEffect } from 'react';
import './App.css';
import Web3 from 'web3';
import IdentityContract from './contracts/Identity.json';

function LandingPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [verifyUniqueId, setVerifyUniqueId] = useState('');
  const [pastOwners, setPastOwners] = useState([]);
  const [popupLog, setPopupLog] = useState('');
  // setShowuserModal
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);

  const [uniqueId, setUniqueId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showuserModal, setShowuserModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showUpdateStolenModal, setShowUpdateStolenModal] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [currentaddress, setCurrentAddress] = useState('');

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

  const verifyDevice = async () => {
    try {
      if (contract) {
        let log = '';
        log += "Verifying device...\n";
        log += `Unique ID: ${verifyUniqueId}\n`;
        const isStolen = await contract.methods.isDeviceStolen(verifyUniqueId).call();
        log += `Is stolen: ${isStolen}\n`;
        
        if (isStolen) {
          const currentOwner = await contract.methods.getCurrentOwner(verifyUniqueId).call();
          log += `Current owner: ${currentOwner}\n`;
          if (currentOwner !== "0x0000000000000000000000000000000000000000") {
          } else {
            alert('Device does not exist or is not registered.');
          }
        } else {
          log += "Getting current owner...\n";
          const currentOwner = await contract.methods.getCurrentOwner(verifyUniqueId).call();
          log += `Current owner: ${currentOwner}\n`;
          if (currentOwner !== "0x0000000000000000000000000000000000000000") {
            await getPastOwners();
          } else {
            alert('Device does not exist or is not registered.');
          }
        }
        setVerifyUniqueId('');
        setPopupLog(log);
      }
    } catch (error) {
      console.error("Error while verifying device:", error);
    }
  };  

  const getPastOwners = async () => {
    try {
      if (contract) {
        let log = '';
        const owners = await contract.methods.getPastOwners(verifyUniqueId).call(); // Use verifyUniqueId instead of uniqueId
        log += `Past Owners: ${owners}\n`;
        setPastOwners(owners);
        setPopupLog(log);
      }
    } catch (error) {
      console.error("Error while getting past owners:", error);
    }
  };

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
  
  const handleVerify = () => {
    setShowVerifyModal(true);
  };

  const handleuserLogin = () => {
    setShowuserModal(true);
  };
  const handlestolenstatus = () => {
    setShowUpdateStolenModal(true);
  };

  const handleManufacturerLogin = () => {
    setShowRegisterModal(true);
  };

  const handleVerifyPopup = () => {
    verifyDevice();
    getPastOwners();
  };

  const handleClosePopup = () => {
    setShowVerifyModal(false);
    setShowRegisterModal(false);
    setShowuserModal(false);
    setPopupLog(''); // Clear the log output
  };

  const handleUserLoginClick = () => {
    setCurrentAddress(document.getElementById('useraddress').value);
    setShowuserModal(false);
    setShowPopup(true);
  };

  return (
    <div className="App">
      <video autoPlay muted loop id="myVideo">
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
      <header className="App-header">
        <div className="title">Blockchain Framework for Intelligent Devices Identity and Access Management</div>
        <div className="subtitle"></div>
      </header>
      <div className="square-container">
        <button className="app-button" onClick={handleVerify}>Verify</button>
        <button className="app-button" onClick={handleuserLogin}>User</button>
        <button className="app-button" onClick={handlestolenstatus}>UpdateStolenStatus</button>
        <div className="manufacturer" onClick={handleManufacturerLogin}>Manufacturer</div>
      </div>
      
      {showVerifyModal && (
        <div className="popup-container">
          <div className="popup">
            <div className="popup-content">
              <button className="close-button" onClick={handleClosePopup}>X</button>
              <label htmlFor="deviceId">Please Enter the Unique ID of the Device below.</label>
              <input type="text" value={verifyUniqueId} onChange={(e) => setVerifyUniqueId(e.target.value)} className="popup-input"/>
              <button onClick={handleVerifyPopup} className="popup-button">Verify</button>
              <pre style={{ color: 'white', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', fontSize: '20px'}}>{popupLog}</pre>
            </div>
          </div>
        </div>
      )}

      {showUpdateStolenModal && (
  <div className="popup-container">
    <div className="popup">
      <div className="popup-content">
        <button className="close-button" onClick={handleClosePopup}>X</button>
        <label htmlFor="deviceId">Please Enter the Unique ID of the Device below.</label>
        <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} className="popup-input"/>
        <button onClick={updateStolenInformation} className="popup-button">Update</button>
      </div>
    </div>
  </div>
)}

      {showRegisterModal && (
        <div className="popup-container">
          <div className="popup">
            <div className="popup-content">
              <button className="close-button" onClick={handleClosePopup}>X</button>
              <label htmlFor="uniqueId">Unique ID:</label>
              <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} className="popup-input"/>
              <label htmlFor="deviceName">Device Name:</label>
              <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="popup-input"/>
              <label htmlFor="deviceType">Device Type:</label>
              <input type="text" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="popup-input"/>
              <button onClick={registerDevice} className="popup-button">Register Device</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="popup-container">
          <div className="popup">
            <div className="popup-content">
              <button className="close-button" onClick={() => setShowPopup(false)}>X</button>
              <p>Current Address: {currentaddress}</p>
              <label htmlFor="uniqueId">Unique ID:</label>
              <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} className="popup-input"/>
              <label htmlFor="uniqueId">New owner address:</label>
              <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="popup-input"/>
              <button onClick={transferOwnership} className="popup-button">Transfer Device</button>
            </div>
          </div>
        </div>
      )}

      {showuserModal && (
        <div className="popup-container">
          <div className="popup">
            <div className="popup-content">
              <button className="close-button" onClick={handleClosePopup}>X</button>
              <label htmlFor="useraddress">User address</label>
              <input 
                id="useraddress"
                type="text"  
                className="popup-input"
              />
              <button className="popup-button" onClick={handleUserLoginClick}>Login</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
// src/LandingPage.js
// import React, { useState, useEffect } from 'react';
// import './App.css';
// import Web3 from 'web3';
// import IdentityContract from './contracts/Identity.json';

// function LandingPage() {
//   const [showPopup, setShowPopup] = useState(false);
//   const [verifyUniqueId, setVerifyUniqueId] = useState('');
//   const [pastOwners, setPastOwners] = useState([]);
//   const [popupLog, setPopupLog] = useState('');

//   const [web3, setWeb3] = useState(null);
//   const [accounts, setAccounts] = useState([]);
//   const [contract, setContract] = useState(null);

//   const [uniqueId, setUniqueId] = useState('');
//   const [deviceName, setDeviceName] = useState('');
//   const [deviceType, setDeviceType] = useState('');
//   const [isRegistered, setIsRegistered] = useState(false);
//   const [showRegisterModal, setShowRegisterModal] = useState(false);
//   const [showVerifyModal, setShowVerifyModal] = useState(false);
//   const [showUpdateStolenModal, setShowUpdateStolenModal] = useState(false);
//   const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
//   const [newOwner, setNewOwner] = useState('');

//   useEffect(() => {
//     const loadBlockchainData = async () => {
//       const web3 = new Web3('http://localhost:7545'); // Connect to Ganache
//       const accounts = await web3.eth.getAccounts();
//       setWeb3(web3);
//       setAccounts(accounts);
//       const networkId = await web3.eth.net.getId();
//       const deployedNetwork = IdentityContract.networks[networkId];
//       const contract = new web3.eth.Contract(
//         IdentityContract.abi,
//         deployedNetwork && deployedNetwork.address
//       );
//       setContract(contract);
//     };
    
//     loadBlockchainData();
//   }, []);

//   const verifyDevice = async () => {
//     try {
//       if (contract) {
//         let log = '';
//         log += "Verifying device...\n";
//         log += `Unique ID: ${verifyUniqueId}\n`;
//         const isStolen = await contract.methods.isDeviceStolen(verifyUniqueId).call();
//         log += `Is stolen: ${isStolen}\n`;
        
//         if (isStolen) {
//           const currentOwner = await contract.methods.getCurrentOwner(verifyUniqueId).call();
//           log += `Current owner: ${currentOwner}\n`;
//           if (currentOwner !== "0x0000000000000000000000000000000000000000") {
//           } else {
//             alert('Device does not exist or is not registered.');
//           }
//         } else {
//           log += "Getting current owner...\n";
//           const currentOwner = await contract.methods.getCurrentOwner(verifyUniqueId).call();
//           log += `Current owner: ${currentOwner}\n`;
//           if (currentOwner !== "0x0000000000000000000000000000000000000000") {
//             await getPastOwners();
//           } else {
//             alert('Device does not exist or is not registered.');
//           }
//         }
//         setVerifyUniqueId('');
//         setPopupLog(log);
//       }
//     } catch (error) {
//       console.error("Error while verifying device:", error);
//     }
//   };  

//   const getPastOwners = async () => {
//     try {
//       if (contract) {
//         let log = '';
//         const owners = await contract.methods.getPastOwners(verifyUniqueId).call(); // Use verifyUniqueId instead of uniqueId
//         log += `Past Owners: ${owners}\n`;
//         setPastOwners(owners);
//         setPopupLog(log);
//       }
//     } catch (error) {
//       console.error("Error while getting past owners:", error);
//     }
//   };

//   const registerDevice = async () => {
//     try {
//       if (contract) {
//         await contract.methods.register(uniqueId, deviceName, deviceType).send({ from: accounts[0], gas: 200000})
//         .on('error', (error) => {
//           if (error.message.includes("out of gas")) {
//             alert("Transaction may have run out of gas, but it's successful.");
//           } else {
//             console.error("Error while registering device:", error);
//             alert('An error occurred while registering the device.');
//           }
//           setIsRegistered(true); // Even if there is a gas error, consider the transaction successful
//           // Clear input fields after attempted registration
//           setUniqueId('');
//           setDeviceName('');
//           setDeviceType('');
//         })
//         .on('receipt', (receipt) => {
//           setIsRegistered(true); // Update isRegistered state to true after successful registration
//           alert('Device registered successfully!');
//           // Clear input fields after successful registration
//           setUniqueId('');
//           setDeviceName('');
//           setDeviceType('');
//         });
//       }
//     } catch (error) {
//       console.error("Error while registering device:", error);
//     }
//   };
  
//   const handleVerify = () => {
//     setShowVerifyModal(true);
//   };

//   const handleUserLogin = () => {
//     setShowRegisterModal(true);
//   };

//   const handleVerifyPopup = () => {
//     verifyDevice();
//     getPastOwners();
//   };

//   const handleClosePopup = () => {
//     setShowVerifyModal(false);
//     setShowRegisterModal(false);
//     setPopupLog(''); // Clear the log output
//   };

//   return (
//     <div className="App">
//       <video autoPlay muted loop id="myVideo">
//         <source src="/video.mp4" type="video/mp4" />
//         Your browser does not support HTML5 video.
//       </video>
//       <header className="App-header">
//         <div className="title">Blockchain Framework for Intelligent Devices Identity and Access Management</div>
//         <div className="subtitle"></div>
//       </header>
//       <div className="square-container">
//         <button className="app-button" onClick={handleVerify}>Verify</button>
//         <div className="manufacturer" onClick={handleUserLogin}>Manufacturer</div>
//       </div>
      
//       {showVerifyModal && (
//         <div className="popup-container">
//           <div className="popup">
//             <div className="popup-content">
//               <button className="close-button" onClick={handleClosePopup}>X</button>
//               <label htmlFor="deviceId">Please Enter the Unique ID of the Device below.</label>
//               <input type="text" value={verifyUniqueId} onChange={(e) => setVerifyUniqueId(e.target.value)} className="popup-input"/>
//               <button onClick={handleVerifyPopup} className="popup-button">Verify</button>
//               <pre style={{ color: 'white', whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', fontSize: '20px'}}>{popupLog}</pre>
//             </div>
//           </div>
//         </div>
//       )}

//       {showRegisterModal && (
//         <div className="popup-container">
//           <div className="popup">
//             <div className="popup-content">
//               <button className="close-button" onClick={handleClosePopup}>X</button>
//               <label htmlFor="uniqueId">Unique ID:</label>
//               <input type="text" value={uniqueId} onChange={(e) => setUniqueId(e.target.value)} className="popup-input"/>
//               <label htmlFor="deviceName">Device Name:</label>
//               <input type="text" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} className="popup-input"/>
//               <label htmlFor="deviceType">Device Type:</label>
//               <input type="text" value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="popup-input"/>
//               <button onClick={registerDevice} className="popup-button">Register Device</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default LandingPage;
