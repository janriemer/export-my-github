import { User, provideGotOptions, BASE_URL } from "./utils";
import * as got from 'got';
import { IncomingHttpHeaders } from 'http';
import {range, flatMap} from 'lodash';

interface RepoApiData {
    name: string
}

function getTotalNumberOfPages(headers: IncomingHttpHeaders): number {
    let link = headers.link;
    let numberOfPages = 0;
    if (link)
    {
        if (link instanceof Array) {
            link = link.join(',');
        } 
        // not so safe regex, but sufficient for now
        const regEx = /.*rel="next".*,.*?page=(\d).*rel="last"/;
        const matches = regEx.exec(link);
        if (matches) {
            // at index 0 we have the total match, but we only want the number therefore index 1
            numberOfPages = Number(matches[1]);
        } else {
            throw new Error(`Can't get total number of pages from header's 'link' property.`);
        }
    } else {
        // if we don't have a link property, we only have one page
        return 1;
    }

    return numberOfPages;
}

export async function getRepoNames(user: User): Promise<string[]> {
    try {
        const PAGE_WINDOW = 50;
        const result = await got(`${BASE_URL}/user/repos?page=1&per_page=${PAGE_WINDOW}`,
            provideGotOptions(user));

        const firstPageRepos = JSON.parse(result.body) as RepoApiData[];

        const numberOfPages = getTotalNumberOfPages(result.headers);

        const restRepos = await flatMap(
            range(2, numberOfPages + 1)
                .map(async page =>
                    await got(`${BASE_URL}/user/repos?page=${page}&per_page=${PAGE_WINDOW}`,
                        provideGotOptions(user)))
                .map(async res => {
                    const localRes = await res;
                    return JSON.parse(localRes.body) as RepoApiData[];
                }),
            async repo => {
                const res = await repo;
                return res.map(repoData => repoData.name);
            });
            
        return [...firstPageRepos.map(res => res.name), ...flatMap(await Promise.all(restRepos))];
    } catch(e) {
        if (e.response) {
            // network error
            if (e.response.statusCode === 404) {
                return ['We could not find the api endpoint for the repos of your user.'];
            } else if (e.response.statusCode === 500) {
                return ['An internal server error occured.'];
            } else {
                return ['An unknown error occured. Please try again later.'];
            }
        } else {
            throw e;
        }
    }
}