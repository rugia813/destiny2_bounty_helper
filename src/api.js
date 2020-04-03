import axios from "axios";

const _axios = axios.create({
    baseURL: 'https://www.bungie.net/',
    timeout: 4000,
    withCredentials: true
  });

const client_id = 31619
const api_key = '43d14bde59e84aca97b5d37287ebc3f0'

export const authorize = () => window.open(`https://www.bungie.net/en/oauth/authorize?client_id=${client_id}&response_type=code&state=6i0mkLx79Hp91nzWVeHrzHG4`, 'blank')

export const getToken = (code) => _axios.post(
    'platform/app/oauth/token/',
    createFormParams({
        client_id,
        grant_type: 'authorization_code',
        code,
    }),
    {
        headers: {
            // Authorization: 'Basic ' + code,
            'X-API-Key': api_key,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }
)

export const getUser = (id) => _axios.get(`/User/GetBungieNetUserById/${id}/`)

function createFormParams (params) {
    return Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
}