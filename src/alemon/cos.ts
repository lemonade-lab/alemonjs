import COS from 'cos-nodejs-sdk-v5'
import { Readable } from 'stream'
import { MysConfig } from '../config/index.js'
export function createCOS() {
  const cos = new COS({
    SecretId: MysConfig.SecretId,
    SecretKey: MysConfig.SecretKey
  })
  return {
    Upload: (data: Buffer, Key: string) => {
      return cos.putObject(
        {
          Bucket: MysConfig.Bucket /* 必须 */,
          Region: MysConfig.Region /* 必须 */,
          Key /* 必须 */,
          StorageClass: 'STANDARD',
          Body: Readable.from([data]), // 上传文件对象
          onProgress: function (progressData) {
            console.log(JSON.stringify(progressData))
          }
        },
        function (err, data) {
          console.log(err || data)
        }
      )
    },
    getUrl: (Key: string) => {
      return cos.getObjectUrl(
        {
          Bucket: MysConfig.Bucket, // 填入您自己的存储桶，必须字段
          Region: MysConfig.Region, // 存储桶所在地域，例如 ap-beijing，必须字段
          Key, // 存储在桶里的对象键（例如1.jpg，a/b/test.txt），支持中文，必须字段
          Sign: true // 获取带签名的对象 URL
        },
        function (err, data) {
          if (err) return console.log(err)
          /* url为对象访问 url */
          const url = data.Url
          return url
        }
      )
    }
  }
}
