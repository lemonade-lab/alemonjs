import { publicIp } from 'public-ip'
const ip = await publicIp({
  onlyHttps: true,
  timeout: 10000
})
  .then((ip: any) => {
    console.info('[OPEN]', 'Callback')
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      return ip
    } else {
      return false
    }
  })
  .catch(err => {
    console.log(err)
    process.exit()
  })
export { ip }
