import Cookies from 'js-cookie'

/** @type {Cookies.CookieAttributes} */
const setting = {
    expires: 1/24,
    sameSite: 'none',
    secure: false,
}

const token = 'destinyToken'
export const getToken = () => Cookies.get(token)
export const setToken = (str) => Cookies.set(token, str, setting)

const memberId = 'memberId'
export const getMemberId = () => Cookies.get(memberId)
export const setMemberId = (str) => Cookies.set(memberId, str, setting)