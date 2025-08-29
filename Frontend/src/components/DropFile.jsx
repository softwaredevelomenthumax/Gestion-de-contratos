import { useRef, useState } from 'react';
import { UploadCloud, Download, X } from 'lucide-react';
import Button from './Button';

export function DropFile({ onFileSelect, multiple = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    let droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' && f.size <= 30 * 1024 * 1024);
    if (droppedFiles.length > 0) {
      setFiles(droppedFiles);
      onFileSelect(droppedFiles);
      setError(null);
    } else {
      setError('Solo se aceptan archivos PDF menores a 30MB.');
      setFiles([]);
      onFileSelect([]);
    }
  };

  const handleChange = (e) => {
    let selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf' && f.size <= 30 * 1024 * 1024);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      onFileSelect(selectedFiles);
      setError(null);
    } else {
      setError('Solo se aceptan archivos PDF menores a 30MB.');
      setFiles([]);
      onFileSelect([]);
    }
  };

  const handleRemove = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 bg-card'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{ cursor: 'pointer' }}
      >
        {files.length > 0 ? (
          <>
            <Download size={48} className="text-blue-500 mb-2" />
            <ul className="w-full mb-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm text-foreground mb-1">
                  <span>{file.name}</span>
                  <Button variant="outline" onClick={e => { e.stopPropagation(); handleRemove(idx); }} className="ml-2 px-2 py-1 text-xs"><X className="inline mr-1" />Quitar</Button>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-sm mb-2">Listo para subir</p>
          </>
        ) : (
          <>
            <UploadCloud size={48} className="text-blue-500 mb-2" />
            <p className="font-semibold text-lg text-center text-foreground">Subir contrato</p>
            <p className="text-muted-foreground text-sm mb-2">Arrastra y suelta uno o varios archivos PDF aquí, o haz clic para seleccionar</p>
            <p className="text-muted-foreground text-xs">Solo archivos .pdf menores a 30MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          multiple={multiple}
        />
      </div>
      {error && <div className="text-red-500 text-sm mt-2 text-center">{error}</div>}
    </div>
  );
}

export default DropFile;