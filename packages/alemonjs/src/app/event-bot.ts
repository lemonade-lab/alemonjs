type BotType = () => typeof global.alemonjs
export const defineBot = (callback: BotType) => callback
