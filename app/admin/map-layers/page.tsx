"use client";
import { useState } from 'react';

export default function MapLayersPage() {
  const [fileName, setFileName] = useState('');
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    await fetch('/api/map-layers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ geojson: JSON.parse(text) }) });
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Map Layers</h1>
      <input type="file" accept="application/geo+json,.json" onChange={onUpload} />
      {fileName && <div className="text-white/70">Uploaded: {fileName}</div>}
    </div>
  );
}

