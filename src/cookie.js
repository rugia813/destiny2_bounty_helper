import Cookies from 'js-cookie'

/** @type {Cookies.CookieAttributes} */
const setting = {
    expires: 1/24,
    sameSite: 'none',
    secure: false,
}

const token = 'destinyToken'
export const getToken = () => Cookies.get(token)
export const removeToken = () => Cookies.remove(token)
export const setToken = (str) => Cookies.set(token, str, setting)

const refreshToken = 'destinyRefreshToken'
export const getRefreshToken = () => Cookies.get(refreshToken)
export const removeRefreshToken = () => Cookies.remove(refreshToken)
export const setRefreshToken = (str, expires) => Cookies.set(refreshToken, str, {...setting, expires})

const memberId = 'memberId'
export const getMemberId = () => Cookies.get(memberId)
export const setMemberId = (str) => Cookies.set(memberId, str, setting)