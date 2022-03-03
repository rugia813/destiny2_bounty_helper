import axios from "axios";
import * as cookie from "./cookie";

const client_id = 31619
const client_secret = 'P0TrcS-jh0ZXkR7QcrB4b7I5LwGWaFL8TXPLfthHxRY'
const api_key = '43d14bde59e84aca97b5d37287ebc3f0'

const _axios = axios.create({
    baseURL: 'https://www.bungie.net/',
    timeout: 10000,
    withCredentials: true,
    headers: {
        'X-API-Key': api_key,
    }
  });

export const authorize = () => window.open(
    `https://www.bungie.net/en/oauth/authorize?client_id=${client_id}&response_type=code&state=6i0mkLx79Hp91nzWVeHrzHG4`,
    'auth_page',
    'left=50,top=50,width=640,height=640'
)

export const getToken = (code) => _axios.post(
    'platform/app/oauth/token/',
    createFormParams({
        client_id,
        grant_type: 'authorization_code',
        client_secret,
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

export const refresh = (refresh_token) => _axios.post(
    'platform/app/oauth/token/',
    createFormParams({
        client_id,
        client_secret,
        grant_type: 'refresh_token',
        refresh_token,
        // code,
    }),
    {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }
)

export const getManifest = () => _axios.get(`/Platform/Destiny2/Manifest/`)

// export const getUser = (id) => _axios.get(`/User/GetBungieNetUserById/${id}/`)
export const getLinkedProfile = (id) => _axios.get(`/Platform/Destiny2/254/Profile/${id}/LinkedProfiles/`)
export const getInventory = (id, membershipType, token = cookie.getToken()) => _axios.get(
    `/Platform/Destiny2/${membershipType}/Profile/${id}/?components=200%2C201`,
        { headers: { Authorization: 'Bearer ' + token } }
    )

function createFormParams (params) {
    return Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
}

export default _axios