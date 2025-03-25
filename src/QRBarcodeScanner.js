import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
console.log('Html5Qrcode version:', Html5Qrcode.version);

const QRBarcodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraList, setCameraList] = useState([]);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Diagnostic function to check camera availability
  const checkCameraAvailability = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media devices not supported in this browser');
        return false;
      }

      // Enumerate available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setCameraList(videoDevices);

      if (videoDevices.length === 0) {
        setError('No cameras found on this device');
        return false;
      }

      return true;
    } catch (err) {
      setError(`Camera check error: ${err.message}`);
      return false;
    }
  };

  const startScanning = async () => {
    try {
      // Perform comprehensive camera check
      const cameraAvailable = await checkCameraAvailability();
      if (!cameraAvailable) return;

      // Ensure library is properly imported and instantiated
      if (typeof Html5Qrcode !== 'function') {
        setError('Html5Qrcode library not properly loaded');
        return;
      }

      if (scannerRef.current) {
        // Use the first available camera device
        const cameraId = cameraList[0]?.deviceId || { facingMode: "environment" };

        html5QrcodeRef.current = new Html5Qrcode(scannerRef.current.id, true);
        
        const config = {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.0
        };

        await html5QrcodeRef.current.start(
          cameraId, 
          config, 
          onScanSuccess,
          onScanFailure
        );
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error("Scanning error:", err);
      setError(`Scanning failed: ${err.message}`);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner", err);
      setError(`Stop scanning error: ${err.message}`);
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    setScanResult({
      text: decodedText,
      format: decodedResult.format?.formatName || 'Unknown'
    });
    stopScanning();
  };

  // Add error handling for scanning failures
  const onScanFailure = (error) => {
    console.error('Scan error:', error);
    setError(`Scanning error: ${error}`);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        stopScanning();
      }
    };
  }, []);

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: 'auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        QR & Barcode Scanner
      </h2>

      {error && (
        <div style={{ 
          backgroundColor: '#ffdddd', 
          color: 'red', 
          padding: '10px', 
          marginBottom: '15px',
          borderRadius: '5px'
        }}>
          {error}
        </div>
      )}

      {/* Camera List Diagnostic Information */}
      {cameraList.length > 0 && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          marginBottom: '15px',
          borderRadius: '5px'
        }}>
          <strong>Available Cameras:</strong>
          <ul>
            {cameraList.map((camera, index) => (
              <li key={camera.deviceId}>
                Camera {index + 1}: {camera.label || 'Unnamed Camera'}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div 
        ref={scannerRef} 
        id="scanner-container" 
        style={{ 
          width: '100%', 
          height: '250px', 
          backgroundColor: '#f0f0f0', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          border: '2px dashed #cccccc',
          borderRadius: '10px'
        }}
      >
        {!isScanning && <p style={{ color: '#888' }}>Camera will appear here</p>}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: '20px' 
      }}>
        {!isScanning ? (
          <button 
            onClick={startScanning} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Scanning
          </button>
        ) : (
          <button 
            onClick={stopScanning} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Stop Scanning
          </button>
        )}
      </div>

      {scanResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#e6f3e6', 
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h3>Scan Result:</h3>
          <p><strong>Text:</strong> {scanResult.text}</p>
          <p><strong>Format:</strong> {scanResult.format}</p>
        </div>
      )}
    </div>
  );
};

export default QRBarcodeScanner;