import * as cookie from "./cookie";
import {
    getProfile,
    getDestinyManifest,
    getLinkedProfiles,
    DestinyComponentType,
} from "bungie-api-ts/destiny2";

const client_id = import.meta.env.VITE_BUNGIE_CLIENT_ID;
const client_secret = import.meta.env.VITE_BUNGIE_CLIENT_SECRET;
const api_key = import.meta.env.VITE_BUNGIE_API_KEY;

// Create our own HTTP client implementation
const httpClient = async (config) => {
    const { method, url, params, body } = config;

    // Build the full URL including query parameters
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const fullUrl = `${url}${queryParams ? '?' + queryParams : ''}`;

    const response = await fetch(fullUrl, {
        method,
        headers: {
            'X-API-Key': api_key,
            'Content-Type': 'application/json',
            ...(cookie.getToken() ? { Authorization: `Bearer ${cookie.getToken()}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();
    return data;
};

export const authorize = () => window.open(
    `https://www.bungie.net/en/oauth/authorize?client_id=${client_id}&response_type=code&state=6i0mkLx79Hp91nzWVeHrzHG4`,
    'auth_page',
    'left=50,top=50,width=640,height=640'
);

export const getToken = async (code) => {
    const response = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
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
    const data = await response.json();

    if (data.access_token && data.membership_id) {
        cookie.setToken(data.access_token);
        // Calculate expiry for refresh token (e.g., 90 days)
        const refreshTokenExpires = 90; // days
        cookie.setRefreshToken(data.refresh_token, refreshTokenExpires);
        cookie.setMemberId(data.membership_id);
        return { success: true, data };
    } else {
        console.error("getToken response missing access_token or membership_id:", data);
        // Clear any potentially partial cookies
        cookie.clearToken();
        return { success: false, error: data.error_description || 'Token fetch failed', data };
    }
};

export const refresh = async (refresh_token) => {
    const response = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
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
    const data = await response.json();

    if (data.access_token && data.membership_id) {
        cookie.setToken(data.access_token);
        // Refresh token expiry might be different, adjust if needed or keep same as initial
        const refreshTokenExpires = 90; // days
        cookie.setRefreshToken(data.refresh_token, refreshTokenExpires);
        cookie.setMemberId(data.membership_id); // Also update memberId on refresh if provided
        return { success: true, data };
    } else {
        console.error("refresh response missing access_token or membership_id:", data);
        // Don't necessarily clear token here, let the caller decide based on error
        return { success: false, error: data.error_description || 'Token refresh failed', data };
    }
};

export const getManifest = async () => {
    const response = await getDestinyManifest(httpClient);
    return { data: response };
};

export const getLinkedProfile = async (id) => {
    const response = await getLinkedProfiles(httpClient, {
        membershipId: id,
        membershipType: 254, // All
        getAllMemberships: true
    });
    return { data: response };
};

export const getProfileData = async (membershipType, membershipId) => {
    const components = [
        DestinyComponentType.Profiles,
        DestinyComponentType.Characters,
        DestinyComponentType.CharacterInventories,
        DestinyComponentType.Records, // Component 900 for profile records
        DestinyComponentType.CharacterRecords, // Component 900 for character-specific records
    ];

    const response = await getProfile(httpClient, {
        destinyMembershipId: membershipId,
        membershipType,
        components
    });
    return { data: response };
};

// Keep getInventory for backwards compatibility, but it uses getProfileData internally
export const getInventory = async (id, membershipType) => {
    return getProfileData(membershipType, id);
};

export default {
    httpClient
};