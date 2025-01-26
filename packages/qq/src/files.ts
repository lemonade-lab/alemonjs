import { readdir, stat, readFile } from 'fs'
import path from 'path'

export function getFilesData(dirPath) {
  return new Promise((resolve, reject) => {
    readdir(dirPath, (err, files) => {
      if (err) {
        reject(err)
        return
      }

      const promises = files.map(file => {
        return new Promise((innerResolve, innerReject) => {
          const filePath = path.join(dirPath, file)

          stat(filePath, (err, stats) => {
            if (err) {
              innerReject(err)
              return
            }

            if (stats.isFile()) {
              readFile(filePath, (err, data) => {
                if (err) {
                  innerReject(err)
                  return
                }

                const base64Data = data.toString('base64')
                innerResolve({
                  name: file,
                  size: stats.size,
                  data: base64Data
                })
              })
            } else {
              innerResolve(null)
            }
          })
        })
      })

      Promise.all(promises)
        .then(results => {
          // 过滤掉null值，只保留文件对象
          const fileObjects = results.filter(result => result !== null)
          resolve(fileObjects)
        })
        .catch(reject)
    })
  })
}
