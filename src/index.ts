#!/usr/bin/env node
import * as inquirer from 'inquirer';
import { validatePersonalAccessToken } from './validators';
import { User } from './utils';
import { getRepoNames } from './data-services';
import { questionUsername, questionAccessTokenFactory, questionsRelatedToUserData } from './questions';
import { handleAnswersForExport, AnswersForExport } from './exporter';

console.log('Hi, welcome to export-my-github.');
console.log('This tool will help you export your Github data.');
console.log('Just answer the following questions. After all your answers, it will bundle a nice package for you and export it to your local disk.');

let user: User;
let username = '';

inquirer.prompt(questionUsername)
    .then((answer: any) => {
        username = answer.username;
        return inquirer
            .prompt(questionAccessTokenFactory(validatePersonalAccessToken(username)));
    })
    .then((answers: any) => {
        user = {accessToken: answers.accessToken, username};
        
        return {
            repos: getRepoNames(user),
            user
        }
    })
    .then(async answers => {
        const ui = new inquirer.ui.BottomBar();
        ui.write('Fetching list of your repositories...\n');
        return inquirer
            // types don't know the field 'choices' in questions object, so we have to go with 'any'
            .prompt(questionsRelatedToUserData(await answers.repos) as any);
    })
    .then(async answers => {
        // TODO: make this more type safe!
        await handleAnswersForExport(answers as AnswersForExport, user);
    });