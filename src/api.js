import axios from "axios";
import * as cookie from "./cookie";

const client_id = 31619
const api_key = '43d14bde59e84aca97b5d37287ebc3f0'

const _axios = axios.create({
    baseURL: 'https://www.bungie.net/',
    timeout: 10000,
    withCredentials: true,
    headers: {
        'X-API-Key': api_key,
    }
  });

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
            // 'X-API-Key': api_key,
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }
)

export const getManifest = () => _axios.get(`/Platform/Destiny2/Manifest/`)

// export const getUser = (id) => _axios.get(`/User/GetBungieNetUserById/${id}/`)
export const getLinkedProfile = (id) => _axios.get(`/Platform/Destiny2/254/Profile/${id}/LinkedProfiles/?getAllMemberships=true`)
export const getInventory = (id, token = cookie.getToken()) => _axios.get(
        `/Platform/Destiny2/3/Profile/${id}/?components=100%2C102%2C103%2C200%2C201%2C202%2C205%2C300%2C301%2C304%2C305%2C306%2C307%2C800%2C308%2C310%2C309%2C900`,
        { headers: { Authorization: 'Bearer ' + token } }
    )

function createFormParams (params) {
    return Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
}

export default _axios