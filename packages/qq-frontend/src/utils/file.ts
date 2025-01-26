class FileProcess {
  upload(files: FileList) {
    const filePromises = Array.from(files).map(file => {
      return new Promise<{ name: string; data: string; size: number }>((resolve, reject) => {
        const reader = new FileReader()
        const { name, size } = file

        reader.onload = (e: Event) => {
          const arrayBuffer = (e.target as FileReader).result as ArrayBuffer
          const byteArray = new Uint8Array(arrayBuffer)
          const base64String = btoa(String.fromCharCode(...byteArray))
          resolve({ name, size, data: base64String })
        }

        reader.onerror = error => {
          reject((error.target as FileReader).error?.stack as string)
        }

        reader.readAsArrayBuffer(file)
      })
    })
    return Promise.all(filePromises)
  }

  download(filesData: Array<{ name: string; data: string; size?: number }>) {
    filesData.forEach(fileData => {
      // 提取base64字符串并去掉前缀（如 "data:text/plain;base64,"）
      const base64String = fileData.data

      // 将base64字符串转换为Uint8Array
      const byteArray = Uint8Array.from(atob(base64String), c => c.charCodeAt(0))

      // 创建Blob对象
      const blob = new Blob([byteArray], { type: 'text/plain' })

      // 创建一个指向blob对象的URL
      const url = URL.createObjectURL(blob)

      // 创建一个a元素并设置属性
      const a = document.createElement('a')
      a.href = url
      a.download = fileData.name

      // 触发点击事件以下载文件
      document.body.appendChild(a)
      a.click()

      // 移除a元素和释放URL对象
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }
}

export default new FileProcess()
