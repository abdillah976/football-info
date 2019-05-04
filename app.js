const { connection } = require('./db/connection');
const fs = require('fs');
const cheerio = require('cheerio');
const https = require('https');
const Team = require('./model/team');
const Player = require('./model/player');

const url = 'https://fr.uefa.com/uefachampionsleague/season=2019/clubs/';
const pathClubsFile = './parse/clubs.html';
const pathTeamsFile = './parse/teams';
const logoFolder = './public/logo';

var teams = [];

function getClubFile() {
    https.get(url, (res) => {
        res.pipe(fs.createWriteStream(pathClubsFile));
        res.on('end', () => {
            console.log(`Fichier enregistré : ${pathClubsFile}`);
        });
    });
}

function getTeamFile(teamId, teamUrl) {
    https.get(teamUrl, (res) => {
        res.pipe(fs.createWriteStream(`${pathTeamsFile}/${teamId}.html`));
        res.on('end', () => {
            console.log(`Fichier enregistré : ${pathTeamsFile}/${teamId}.html`);
        });
    });
}

function parseFile(path) {
    connection.then(res => {
    console.log("Mongodb connecté");
    fs.readFile(path, (err, file) => {
        if(err)console.log(err);
        const $ = cheerio.load(file.toString());
        
        let domTeams = $('div.team-is-club');
        var currentTeam = null;
        
        domTeams.toArray().forEach(domTeam => {
            var teamPlayers = [];
            // Récupération du nom de l'équipe
            var name = $(domTeam).find('.club-logo').attr('title');

            // Récupération de l'identifiants de l'équipe
            var teamId = $(domTeam).find('a.team-wrap')
                .attr('href').split('club')[2]
                .split('=')[1].split('/')[0];

            // Récupération du pays de l'équipe
            var country = $(domTeam).find('span.team-name')
            .text().split('(')[1].split(')')[0];
            
            var logoUrl = $(domTeam).find('.club-logo').attr('style').split('(')[1].split("'")[1];
            
            const writeStream = fs.createWriteStream(`${logoFolder}/${teamId}.png`);
            // Enregistre l'image dans le dossier public
            https.get(logoUrl, res => {
                res.pipe(writeStream);

                res.on('end', () => {
                    console.log(`Fin du téléchargement :${logoFolder}/${teamId}.png`);
                })
            })

            // Récupération des équipes
            fs.stat(`${pathTeamsFile}/${teamId}.html`, (err, stats) => {
                if (err) {// Introuvable
                    getTeamFile(teamId, `${url}/club=${teamId}`);
                }
            });
            // Extraction des joueurs
            try {
                const dataFile = fs.readFileSync(`${pathTeamsFile}/${teamId}.html`, 'utf8');
                const $ = cheerio.load(dataFile.toString());
                var players = $('li.squad--team-player');
                var currentPlayer = null;
                players.toArray().forEach(player => {
                    currentPlayer = new Player({
                        "role": $(player).find('span.squad--player-role').text().trim(),
                        "num": $(player).find('span.squad--player-num').text().trim(),
                        "name": $(player).find('span.squad--player-name-name').text().trim().split('*')[0].trimRight(),
                        "surname": $(player).find('span.squad--player-name-surname').text().trim().split('*')[0].trimRight()
                    });
                    teamPlayers.push(currentPlayer);
                    // Enregistrement d'une équipe dans la base de données
                    currentPlayer.save().then(newPlayer => {
                        console.log(`Le joueur ${newPlayer.name} est enregistré`);
                    });
                });
                currentTeam = new Team({
                    "teamId": teamId,
                    "name": name,
                    "country": country,
                    "teamPlayers": teamPlayers,
                    "logoUrl": logoUrl
                });
                // Enregistrement d'une équipe dans la base de données
                currentTeam.save().then(newTeam => {
                    console.log(`${newTeam.name} enregistré`);
                });
                } catch (err) {
                    console.error(err);
                }
            });
        });
    });
}

fs.stat(pathClubsFile, (err, stats) => {
    if (err) { // Introuvable
        getClubFile();
    }
});
parseFile(pathClubsFile);