import { validateUsername } from "./validators";

export enum OtherDataChoices {
    STARRED,
    FOLLOWING,
    FOLLOWER
}

export const questionUsername = [
    {
        type: 'input',
        name: 'username',
        message: 'What is your Github user name?',
        validate: validateUsername
    },
];

export const questionAccessTokenFactory =
(validatePersonalAccessTokenFn: (accessToken: string) => Promise<boolean|string>) => [
    {
        type: 'password',
        name: 'accessToken',
        mask: '*',
        message: 'What is your personal access token?',
        validate: validatePersonalAccessTokenFn
    }
];

export const questionsRelatedToUserData = (repos: string[]) => [
    {
        type: 'checkbox',
        name: 'repoNames',
        message: 'Which of your repositories do you want to export?',
        choices: repos
    },
    {
        type: 'checkbox',
        name: 'otherUserData',
        message: 'What else do you want to export?',
        choices: [
            {
                name: 'Starred repositories',
                value: OtherDataChoices.STARRED
            },
            {
                name: 'People, I follow',
                value: OtherDataChoices.FOLLOWING
            },
            {
                name: 'People, who are following me',
                value: OtherDataChoices.FOLLOWER
            }
        ]
    }
]