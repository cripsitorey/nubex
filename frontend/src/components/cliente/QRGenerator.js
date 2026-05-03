"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QRGenerator({ clienteId }) {
  // Simple ofuscación
  const encodedData = btoa(`nubex-client:${clienteId}`);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-[0_0_40px_rgba(0,229,255,0.4)] transition-shadow">
      <div className="bg-white p-2 rounded-xl">
        <QRCodeSVG 
          value={encodedData} 
          size={200}
          bgColor={"#ffffff"}
          fgColor={"#0B0F19"}
          level={"H"}
          includeMargin={false}
        />
      </div>
      <p className="mt-4 text-[#0B0F19] font-mono font-bold tracking-widest uppercase text-sm">
        ID: {clienteId}
      </p>
      <p className="mt-1 text-[#0B0F19]/60 text-xs text-center font-sans">
        Muestra este código al vendedor
      </p>
    </div>
  );
}
