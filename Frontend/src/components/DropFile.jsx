import { useRef, useState } from 'react';
import { UploadCloud, Download, X } from 'lucide-react';
import Button from './Button';

export function DropFile({
  onFileSelect,
  multiple = false,
  accept = ".pdf,.doc,.docx",
}) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

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

  let droppedFiles = Array.from(e.dataTransfer.files).filter(
    (f) => allowedTypes.includes(f.type) && f.size <= 30 * 1024 * 1024
  );

  if (droppedFiles.length > 0) {
    setFiles(droppedFiles);
    onFileSelect(droppedFiles);
    setError(null);
  } else {
    setError("Solo se aceptan archivos PDF, DOC o DOCX menores a 30MB.");
    setFiles([]);
    onFileSelect([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }
};

  const handleChange = (e) => {
    let selectedFiles = Array.from(e.target.files).filter(
      (f) => allowedTypes.includes(f.type) && f.size <= 30 * 1024 * 1024
    );

    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      onFileSelect(selectedFiles);
      setError(null);
    } else {
      setError("Solo se aceptan archivos PDF, DOC o DOCX menores a 30MB.");
      setFiles([]);
      onFileSelect([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (idx) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    onFileSelect(newFiles);
    // Reset input value to allow re-selecting the same file
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full min-w-0">
      <div
        className={`flex min-w-0 flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 sm:p-8 transition-colors ${
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
            <ul className="w-full min-w-0 mb-2 space-y-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 break-words text-left leading-relaxed">{file.name}</span>
                  <Button
                    variant="outline"
                    onClick={e => { e.stopPropagation(); handleRemove(idx); }}
                    className="w-full shrink-0 px-2 py-1 text-xs sm:ml-2 sm:w-auto"
                  >
                    <X className="mr-1 h-4 w-4" />Quitar
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-center text-muted-foreground text-sm mb-2">Listo para subir</p>
          </>
        ) : (
          <>
            <UploadCloud size={48} className="text-blue-500 mb-2" />
            <p className="font-semibold text-lg text-center text-foreground">Subir contrato</p>
            <p className="text-center text-muted-foreground text-sm mb-2">Arrastra y suelta uno o varios archivos aquí, o haz clic para seleccionar</p>
            <p className="text-center text-muted-foreground text-xs">Solo archivos .pdf .doc .docx menores a 30MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
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