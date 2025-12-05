"use client";

import { useState } from "react";

export default function FotosUploader() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <div>
      <p className="font-semibold">Fotos:</p>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files) return;
          setFiles(Array.from(e.target.files));
        }}
      />
    </div>
  );
}
