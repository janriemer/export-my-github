import { OtherDataChoices } from "./questions";
import * as got from 'got';
import { BASE_URL, provideGotOptions, User } from "./utils";
import {interval, of, Subject, from, empty} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {createWriteStream} from 'fs';
import * as download from 'download';
import * as archiver from "archiver";

export interface AnswersForExport {
    repoNames: string[],
    otherUserData: OtherDataChoices[]
}

interface MigrationArchive {
    state: string,
    url: string,
    archive_url?: string
}

async function checkStateMigrationArchive(user: User, urlWithMigrationId: string) {
    try {
        const response = await got(urlWithMigrationId,
            provideGotOptions(user));
        
        const jsonObj = JSON.parse(response.body) as MigrationArchive;

        return jsonObj.state === 'exported';
    } catch (e) {
        if (e.response) {
            handleResponseError(e);
        } else {
            throw e;
        }
    }
}

function handleResponseError(e: any) {
    if (e.response.statusCode === 404) {
        throw new Error('We could not find the api endpoint for the export.');
    } else if (e.response.statusCode === 500) {
        throw new Error('An internal server error occured.');
    } else {
        throw new Error('An unknown error occured. Please try again later.\n' + e);
    }
}

async function createMigrationArchive(repositories: string[], user: User) {
    const postOptions = Object.assign(provideGotOptions(user), {
        body: JSON.stringify({
            repositories: repositories.map(repoName => `${user.username}/${repoName}`)
        })
    });

    try {
        const archiveReadyDestroy$ = new Subject();
        const response = await got.post(`${BASE_URL}/user/migrations`, postOptions);

        const jsonObj = JSON.parse(response.body) as MigrationArchive;

        const urlWithArchiveId = jsonObj.url;
        const archiveReady$ = interval(5000).pipe(
            switchMap(_ => from(checkStateMigrationArchive(user, urlWithArchiveId))),
            switchMap(archiveReady => {
                if (archiveReady) {
                    archiveReadyDestroy$.next(true);
                    archiveReadyDestroy$.unsubscribe();
                }
                return of({archiveReady, urlWithArchiveId});
            }),
            takeUntil(archiveReadyDestroy$)
        );

        return archiveReady$;

    } catch (e) {
        if (e.response) {
            handleResponseError(e);
            return empty();
        } else {
            throw e;
        }
    }
}

async function getMigrationArchive(archiveUrl: string, user: User) {
    const response = await download(archiveUrl, undefined, provideGotOptions(user));
    return response;
}

function getStarredRepos(user: User) {
    const response = got.stream(`${BASE_URL}/user/starred`, provideGotOptions(user));
    return response;
}

function getFollowers(user: User) {
    const response = got.stream(`${BASE_URL}/user/followers`, provideGotOptions(user));
    return response;
}

function getFollowing(user: User) {
    const response = got.stream(`${BASE_URL}/user/following`, provideGotOptions(user));
    return response;
}

export async function handleAnswersForExport(answers: AnswersForExport, user: User) {
    const {repoNames, otherUserData} = answers;
    const fileNameDestination = process.cwd() + '/myExportedGithub.tar.gz';
    const fileDestinationStream = createWriteStream(fileNameDestination);

    //TODO: refactor this!

    if (repoNames && repoNames.length > 0) {
        // due to Github taking a bit time to create the archive, we inform the user about this
        console.log('Github is now preparing your archive.\n'
            + 'Depending on the number of repositories you have choosen, this might take a while.\n'
            + 'From this point on you don\'t have to do anything anymore.\n'
            + 'We will inform you, when your data has been exported.');
        const migrationArchive$ = await createMigrationArchive(repoNames, user);
        let urlWithArchiveId: string;
        migrationArchive$.subscribe(
            obj => {
                urlWithArchiveId = obj.urlWithArchiveId;
            },
            err => {
                throw err;
            },
            async () => {
                console.log('Migration archive is now exporting...');
                
                const archive = await createExportArchive(
                    user, otherUserData, urlWithArchiveId + '/archive'
                );
                archive.pipe(fileDestinationStream);
                console.log(`Your archive has been exported to: ${fileNameDestination}`);
            }
        )
    } else if (otherUserData && otherUserData.length > 0) {
        console.log('Migration archive is now exporting...');
        
        const archive = await createExportArchive(
            user, otherUserData
        );
        
        archive.pipe(fileDestinationStream);

        console.log(`Your archive has been exported to: ${fileNameDestination}`);
    } else {
        console.log('You have choosen to not export any data from your Github.');
        console.log(`If you don't know how to select the data to export:
- You can navigate with the <up-/down>-keys between the different options
- Press <space> to select certain data.`)
    }
}

const otherUserDataDispatchFunctions = {
    [OtherDataChoices.STARRED]: {
        otherUserDataFn: getStarredRepos,
        archiverEntryData: {name: 'starred.json'}
    },
    [OtherDataChoices.FOLLOWER]: {
        otherUserDataFn: getFollowers,
        archiverEntryData: {name: 'followers.json'}
    },
    [OtherDataChoices.FOLLOWING]: {
        otherUserDataFn: getFollowing,
        archiverEntryData: {name: 'following.json'}
    },
}

async function createExportArchive(user: User, otherUserData: OtherDataChoices[], archiveUrl?: string): Promise<archiver.Archiver> {
    const archive = archiver('tar');

    if (archiveUrl)
    {
        const migArchive = await getMigrationArchive(archiveUrl, user);
        archive.append(migArchive, {name: 'repos.tar.gz'});
    }

    for (const otherDataChoice of otherUserData) {
        const {otherUserDataFn, archiverEntryData} = otherUserDataDispatchFunctions[otherDataChoice];
        archive.append(otherUserDataFn(user), archiverEntryData);
    }

    return archive;
}