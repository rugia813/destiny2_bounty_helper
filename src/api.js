import * as cookie from "./cookie";

const client_id = 31619;
const client_secret = 'P0TrcS-jh0ZXkR7QcrB4b7I5LwGWaFL8TXPLfthHxRY';
const api_key = '43d14bde59e84aca97b5d37287ebc3f0';
const base_url = 'https://www.bungie.net/Platform';

// Create HTTP client for requests
const makeRequest = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'X-API-Key': api_key,
            ...options.headers
        }
    });
    return response.json();
};

export const authorize = () => window.open(
    `https://www.bungie.net/en/oauth/authorize?client_id=${client_id}&response_type=code&state=6i0mkLx79Hp91nzWVeHrzHG4`,
    'auth_page',
    'left=50,top=50,width=640,height=640'
);

export const getToken = async (code) => {
    const response = await makeRequest('https://www.bungie.net/platform/app/oauth/token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: client_id.toString(),
            client_secret,
            code
        })
    });
    return { data: response };
};

export const refresh = async (refresh_token) => {
    const response = await makeRequest('https://www.bungie.net/platform/app/oauth/token/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: client_id.toString(),
            client_secret,
            refresh_token
        })
    });
    return { data: response };
};

export const getManifest = async () => {
    const response = await makeRequest(`${base_url}/Destiny2/Manifest/`);
    return { data: response };
};

export const getLinkedProfile = async (id) => {
    const response = await makeRequest(`${base_url}/Destiny2/254/Profile/${id}/LinkedProfiles/`);
    return { data: response };
};

export const getInventory = async (id, membershipType, token = cookie.getToken()) => {
    const components = [200, 201]; // Character and item components
    const response = await makeRequest(
        `${base_url}/Destiny2/${membershipType}/Profile/${id}/?components=${components.join(',')}`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    return { data: response };
};

export default {
    makeRequest
};