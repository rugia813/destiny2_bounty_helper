import Cookies from 'js-cookie'

const token = 'token'
export const getToken = () => Cookies.get(token)
export const setToken = (str) => Cookies.set(token, str)

const memberId = 'memberId'
export const getMemberId = () => Cookies.get(memberId)
export const setMemberId = (str) => Cookies.set(memberId, str)