import React, { useCallback, useState } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'

interface FileUploadProps {
    onFileSelect: (file: File) => void
    accept?: string
    maxSize?: number // en MB
    disabled?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = '.xlsx,.xls',
    maxSize = 10,
    disabled = false,
}) => {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)

    const validateFile = (file: File): string | null => {
        // Validar tamaño
        const sizeMB = file.size / (1024 * 1024)
        if (sizeMB > maxSize) {
            return `El archivo es muy grande (${sizeMB.toFixed(
                2
            )}MB). Máximo permitido: ${maxSize}MB`
        }

        // Validar extensión
        const extension = file.name.split('.').pop()?.toLowerCase()
        const acceptedExtensions = accept.split(',').map((ext) => ext.trim().replace('.', ''))
        if (extension && !acceptedExtensions.includes(extension)) {
            return `Tipo de archivo no permitido. Permitidos: ${accept}`
        }

        return null
    }

    const handleFile = (file: File) => {
        setError(null)

        const validationError = validateFile(file)
        if (validationError) {
            setError(validationError)
            setSelectedFile(null)
            return
        }

        setSelectedFile(file)
        onFileSelect(file)
    }

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setDragActive(false)

            if (disabled) return

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0])
            }
        },
        [disabled]
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (disabled) return

        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleRemove = () => {
        setSelectedFile(null)
        setError(null)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="w-full">
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center
                    transition-colors duration-200
                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                    ${
                        disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:border-gray-400'
                    }
                    ${error ? 'border-red-500 bg-red-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept={accept}
                    onChange={handleChange}
                    disabled={disabled}
                />

                {!selectedFile && !error && (
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold text-blue-600 hover:text-blue-500">
                                Haz clic para seleccionar
                            </span>{' '}
                            o arrastra y suelta
                        </p>
                        <p className="text-xs text-gray-500">
                            {accept.toUpperCase()} hasta {maxSize}MB
                        </p>
                    </label>
                )}

                {selectedFile && !error && (
                    <div className="flex items-center justify-center gap-3">
                        <File className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            disabled={disabled}
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
