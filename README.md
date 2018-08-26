# export-my-github
A CLI tool for exporting your data on Github to your local hard drive.

## Motivation
According to [GDPR Art. 20](https://gdpr-info.eu/art-20-gdpr/) a company has to give you access to the personal data it has stored about you *in a structured, commonly used and machine-readable format* where *the processing is carried out by **automated means***. In my opinion, Github fails at this miserably! You have to [`curl`](https://developer.github.com/changes/2018-05-24-user-migration-api/) [your](https://developer.github.com/v3/migrations/users/#start-a-user-migration) [way](https://developer.github.com/v3/migrations/users/#get-the-status-of-a-user-migration) to their apis to get all the data you want. They call it ["Data Portability tools"](https://help.github.com/articles/github-privacy-statement/#how-you-can-access-and-control-the-information-we-collect) - what a cheek!

Once again, it seems we have to [clear out the :unicorn: :hankey:](https://vimeo.com/200666291).

You might ask:

> But why not file a case against Github and wait until they have fixed this?

[Because we need this](https://github.com/selfagency/microsoft-drop-ice) - [now](https://github.com/selfagency/microsoft-drop-ice/issues/237#issuecomment-414156919)!

## Install
```bash
$ npm i export-my-github -g
```
Or, if you just want to use it once:
```bash
$ npx export-my-github
```

## 	Prerequisites
1. Node >= 8
2. Make sure you have created a [personal access token](https://github.com/settings/tokens) with read access for your Github account on the following entities:

- [x] repo
    - [x] repo:status
    - [x] repo_deployment
    - [x] public_repo
    - [x] repo:invite
- [x] user
    - [x] read:user
    - [x] user:email
    - [x] user:follow

## Usage
```bash
$ export-my-github
```
or
```bash
$ emg
```

After execution you will first be asked for your username and personal access token (PAT) (see [Prerequisites](#Prerequisites)).

> Warning: Do not give your PAT to a software or website you don't trust! Otherwise it gains the right to do anything you have granted the PAT to do. This tool is open source, so you can always check the trustworthiness of this tool for yourself.

After your username and PAT have been validated, you can choose which data you want to export. Currently the following data can be exported:
- [x] Your repositories
- [x] The repositories you are starring
- [x] The people, who you follow
- [x] The people, who are following you

Your exported data will be archived in a gzip folder named `myExportedGithub.tar.gz` in the same directory where you have executed `export-my-github`.

## License
GNU GPLv3