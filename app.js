const fs = require('fs');
const cheerio = require('cheerio');
const https = require('https');

const url = 'https://fr.uefa.com/uefachampionsleague/season=2019/clubs/';
const pathClubsFile = './parse/clubs.html';
const pathTeamsFile = './parse/teams';
const logoFolder = './public/logo';

var teamsInfo = [];
var teamPlayers = [];

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
    fs.readFile(path, (err, file) => {
        if(err)console.log(err);
        const $ = cheerio.load(file.toString());
        
        var teams = $('div.team-is-club');
        
        teams.toArray().forEach(team => {
            // Récupération du nom de l'équipe
            var name = $(team).find('.club-logo').attr('title');

            // Récupération de l'identifiants de l'équipe
            var teamId = $(team).find('a.team-wrap')
                .attr('href').split('club')[2]
                .split('=')[1].split('/')[0];

            // Récupération du pays de l'équipe
            var country = $(team).find('span.team-name')
            .text().split('(')[1].split(')')[0];

            
            var logoUrl = $(team).find('.club-logo').attr('style').split('(')[1].split("'")[1];
            teamsInfo.push({'teamId':teamId, 'name':name, 'country':country, 'logoUrl':logoUrl});
            
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
                players.toArray().forEach(player => {
                    teamPlayers.push({
                        "role": $(player).find('span.squad--player-role').text().trim(),
                        "num": $(player).find('span.squad--player-num').text().trim(),
                        "name": $(player).find('span.squad--player-name-name').text().trim().split('*')[0].trimRight(),
                        "surname": $(player).find('span.squad--player-name-surname').text().trim().split('*')[0].trimRight()
                    });
                });
            } catch (err) {
                console.error(err);
            }
        });
    });
}

fs.stat(pathClubsFile, (err, stats) => {
    if (err) { // Introuvable
        getTeamFile();
    }
});
parseFile(pathClubsFile);