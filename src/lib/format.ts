export const maskMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, '')
  return digits.length >= 4 ? `•••• ••• ${digits.slice(-4)}` : mobile
}

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name

export const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const downscaleImage = (file: File, maxSide = 900, quality = 0.72) =>
  new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    image.src = url
  })
