export * from './user.js'
export * from './event.js'
export const everyoneError = (err: any) => {
  console.error(err)
  return err
}
