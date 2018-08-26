import * as got from 'got';
import {BASE_URL, provideGotOptions} from './utils';


export async function validateUsername(username: string): Promise<boolean|string> {
    if (username === '') {
        return `Please enter your username.`;
    }

    console.log('\nValidating your username...');

    try {
        // TODO: only make HEAD request, not full GET
        const result = await got(`${BASE_URL}/users/${username}`);
        return true;
    } catch (e) {
        if (e.response.statusCode === 404) {
            return `The username '${username}' does not exist on Github.`;
        } else if (e.response.statusCode === 500) {
            return `An internal server error occured. Please try again later.`;
        } else {
            return `An unknown error occured.`;
        }
    }
}

export const validatePersonalAccessToken = (username: string) =>
    async (accessToken: string): Promise<boolean|string> => {
    if (accessToken === '') {
        return `Please enter your personal access token.`;
    }

    console.log('\nValidating your access token...');

    try {
        // TODO: only make HEAD request, not full GET
        const result = await got(`${BASE_URL}/user/migrations`,
            provideGotOptions({username, accessToken}));
        return result.statusCode === 200;
    } catch (e) {
        if (e.response.statusCode === 401) {
            return 'Authorization denied. Your access token might be wrong or has expired.';
        } else {
            return `An unknown error occured. We can't validate your access token at the moment.`;
        }
    }
}