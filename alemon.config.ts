import { defineAlemonConfig } from './src/index.js'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export default defineAlemonConfig({
  login: {
    // villa: {
    //   bot_id: 'bot_tl7fyj8YojTzhzWTICGY',
    //   secret: 'ibGutjhSx3mZISinUrPcmzKhEjheRr1TPpXjiFB6A4RWO',
    //   pub_key:
    //     '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCcw5zU/MD+HvVGKPYlI1VqtUK0\niaWfnSqdRCmsik2Q5zU6/bV5Cnp8Jog9XfZlkELR9cRfQDKlbM2YWEJKBXFlEoHg\n8/mOnJYxLhFhphx3H8bTbWOAXqPta5vs/mhx1DSZ8QWm6veql8RbLYalBsa0cZBM\nAXOJS+y0YTdkpztycQIDAQAB\n-----END PUBLIC KEY-----\n'
    // },
    // discord: {
    //   token:
    //     'MTE1NzE1MjE5OTgyMzA2OTIxNQ.GvQPhi.UwXc8sieZ8q3xCQmcOyL36d6fZGAmIyfvoo5tU'
    // }
  },
  app: {
    init: false
  }
})
