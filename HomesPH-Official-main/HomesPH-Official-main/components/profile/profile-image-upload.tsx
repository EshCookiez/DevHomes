'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Camera, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { uploadProfileImageAction } from '@/app/dashboard/profile/actions'
import { useToast } from '@/hooks/use-toast'

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedBlob(imageSrc: string, crop: Area) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 500
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas not supported.')
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    500,
    500,
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to crop image.'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.92)
  })
}

export default function ProfileImageUpload({
  userId,
  currentImageUrl,
  onUploaded,
}: {
  userId: string
  currentImageUrl: string | null
  onUploaded: (url: string) => void
}) {
  const { toast } = useToast()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const previewStyle = useMemo(() => ({
    backgroundImage: currentImageUrl ? `url(${currentImageUrl})` : undefined,
  }), [currentImageUrl])

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea)
  }, [])

  function resetModal() {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl)
    }
    setSourceFile(null)
    setSourceUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  function onSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setSourceFile(file)
    setSourceUrl(url)
    setOpen(true)
  }

  function closeDialog(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetModal()
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function triggerPick() {
    inputRef.current?.click()
  }

  function handleUpload() {
    if (!sourceFile || !sourceUrl || !croppedAreaPixels) return

    startTransition(async () => {
      try {
        const blob = await getCroppedBlob(sourceUrl, croppedAreaPixels)
        const file = new File([blob], `profile-${userId}.jpg`, { type: 'image/jpeg' })
        const formData = new FormData()
        formData.set('file', file)
        const result = await uploadProfileImageAction(formData)

        if (!result.success || !result.data) {
          throw new Error(result.message)
        }

        onUploaded(result.data.profileImageUrl)
        router.refresh()
        toast({ title: 'Profile photo updated', description: result.message })
        closeDialog(false)
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Unable to upload image.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="hidden h-14 w-14 rounded-xl border border-slate-200 bg-cover bg-center sm:block" style={previewStyle} />
        <Button type="button" onClick={triggerPick} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
          <Camera size={15} />
          Upload Photo
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
      </div>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl rounded-xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Crop profile image</DialogTitle>
            <DialogDescription>Preview and crop your photo to a 1:1 square before uploading.</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <div className="relative h-[380px] overflow-hidden rounded-xl bg-slate-950">
              {sourceUrl ? (
                <Cropper
                  image={sourceUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : null}
            </div>
          </div>
          <div className="px-6 py-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>
            <Slider value={[zoom]} min={1} max={3} step={0.1} onValueChange={(value) => setZoom(value[0] ?? 1)} />
          </div>
          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={() => closeDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpload} disabled={isPending} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {isPending ? 'Uploading...' : 'Save Photo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
