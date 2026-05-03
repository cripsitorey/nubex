"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { ScanLine } from "lucide-react";

export default function ScannerQR({ onScanSuccess }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Configurar el escáner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    const onScan = (decodedText) => {
      // Limpiar el escáner y notificar éxito
      scanner.clear();
      onScanSuccess(decodedText);
    };

    const onScanError = (err) => {
      // Opcionalmente manejar errores sutiles (ej. no encuentra QR temporalmente)
    };

    scanner.render(onScan, onScanError);
    scannerRef.current = scanner;

    // Limpieza al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="glass-card p-4 rounded-3xl overflow-hidden flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <ScanLine className="w-5 h-5 text-primary" />
        <h3 className="text-white font-bold">Escanear Cliente</h3>
      </div>
      
      {/* Contenedor principal para la librería (id obligatorio) */}
      <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden [&_video]:rounded-xl [&_#qr-reader__dashboard_section_csr]:bg-base-200 [&_#qr-reader__dashboard_section_csr]:p-2 [&_#qr-reader__dashboard_section_csr]:rounded-xl [&_button]:btn [&_button]:btn-primary [&_button]:btn-sm [&_button]:mt-2" />
    </div>
  );
}
