export const BASE_URL = 'https://api.github.com';

export interface User {
    username: string;
    accessToken: string;
}

export function provideGotOptions(user: User) {
    return {
        headers: {
            'Accept': 'application/vnd.github.wyandotte-preview+json'
        },
        auth: `${user.username}:${user.accessToken}`
    }
}