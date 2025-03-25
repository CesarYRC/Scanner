import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

const QRBarcodeScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameraList, setCameraList] = useState([]);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const mountedRef = useRef(false);
  const videoStreamRef = useRef(null); // Añadimos un ref para controlar el stream

  const checkCameraAvailability = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media devices not supported in this browser');
        return false;
      }

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
  }, []);

  const stopScanning = useCallback(async () => {
    try {
      if (codeReaderRef.current) {
        // Safely stop any ongoing decoding
        codeReaderRef.current.reset();

        // Detener la transmisión de video
        const stream = videoStreamRef.current;
        if (stream) {
          stream.getTracks().forEach(track => track.stop()); // Detener cada track
          videoStreamRef.current = null;
        }
      }

      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Stop scanning error:', err);
      setError(`Stop scanning error: ${err.message}`);
    }
  }, []);

  const startScanning = useCallback(async () => {
    try {
      // Detener cualquier escaneo en curso
      await stopScanning();

      // Verificar disponibilidad de la cámara
      const cameraAvailable = await checkCameraAvailability();
      if (!cameraAvailable) return;

      // Crear un nuevo lector de códigos
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      // Obtener dispositivos de entrada de video
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('No cameras found');
        return;
      }

      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Asegurarse de que el componente aún está montado
      if (!mountedRef.current) return;

      // Obtener el stream de video y asignarlo al videoRef
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId },
      });

      videoRef.current.srcObject = stream;
      videoStreamRef.current = stream;

      // Iniciar el escaneo de códigos
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (!mountedRef.current) return;

          if (result) {
            setScanResult({
              text: result.getText(),
              format: result.getBarcodeFormat(),
            });
            stopScanning();
          }

          if (error && !(error instanceof DOMException)) {
            console.error('Scan error:', error);
          }
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Scanning error:', err);
      setError(`Scanning failed: ${err.message}`);
      await stopScanning();
    }
  }, [checkCameraAvailability, stopScanning]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>QR & Barcode Scanner</h2>

      {error && (
        <div style={{ backgroundColor: '#ffdddd', color: 'red', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {/* Camera List Diagnostic Information */}
      {cameraList.length > 0 && (
        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
          <strong>Available Cameras:</strong>
          <ul>
            {cameraList.map((camera, index) => (
              <li key={camera.deviceId}>Camera {index + 1}: {camera.label || 'Unnamed Camera'}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ width: '100%', height: '250px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px dashed #cccccc', borderRadius: '10px', marginBottom: '20px' }}>
        <video ref={videoRef} style={{ maxWidth: '100%', maxHeight: '100%' }} playsInline>
          {!isScanning && <p style={{ color: '#888' }}>Camera will appear here</p>}
        </video>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!isScanning ? (
          <button onClick={startScanning} style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Start Scanning
          </button>
        ) : (
          <button onClick={stopScanning} style={{ width: '100%', padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Stop Scanning
          </button>
        )}
      </div>

      {scanResult && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f3e6', borderRadius: '5px', textAlign: 'center' }}>
          <h3>Scan Result:</h3>
          <p><strong>Text:</strong> {scanResult.text}</p>
          <p><strong>Format:</strong> {scanResult.format}</p>
        </div>
      )}
    </div>
  );
};

export default QRBarcodeScanner;
