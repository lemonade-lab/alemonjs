import React from 'react'
import { createRequire } from '../utils/module.js'
const require = createRequire(import.meta.url)
import { LinkCSS } from './link-css.js'
/**
 * 得到基础link组件
 * @returns
 */
export const LinkMain = () => <LinkCSS src={require('../../public/main.css')} />
