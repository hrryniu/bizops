'use client'

import { useState, useRef } from 'react'
import { Button } from './button'
import { Card } from './card'
import { Upload, File, X, Eye, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onRemove: () => void
  selectedFile: File | null
  isProcessing?: boolean
  acceptedTypes?: string
  maxSize?: number // w MB
  className?: string
}

export function FileUpload({
  onFileSelect,
  onRemove,
  selectedFile,
  isProcessing = false,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  className
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Sprawdź rozmiar pliku
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Plik jest za duży. Maksymalny rozmiar: ${maxSize}MB`)
      return
    }

    // Sprawdź typ pliku
    const acceptedTypesArray = acceptedTypes.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!acceptedTypesArray.includes(fileExtension)) {
      alert(`Nieobsługiwany typ pliku. Dozwolone: ${acceptedTypes}`)
      return
    }

    onFileSelect(file)

    // Utwórz podgląd dla obrazów
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleFiles(e.target.files)
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes}
        onChange={handleChange}
        disabled={isProcessing}
      />

      {!selectedFile ? (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              {isProcessing ? 'Przetwarzanie...' : 'Przeciągnij plik tutaj'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              lub kliknij, aby wybrać plik
            </p>
            <p className="text-xs text-muted-foreground">
              Obsługiwane formaty: PDF, JPG, PNG (max {maxSize}MB)
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Podgląd"
                className="max-w-full h-48 object-contain rounded border"
              />
            </div>
          )}
        </Card>
      )}
    </div>
  )
}



