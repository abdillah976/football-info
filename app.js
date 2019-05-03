const fs = require('fs');
const cheerio = require('cheerio');
const https = require('https');

const url = 'https://fr.uefa.com/uefachampionsleague/season=2019/clubs/';
const pathClubsFile = './parse/clubs.html';
const pathTeamsFile = './parse/teams';
const logoFolder = './public/logo';

var teamsInfo = [];

function getClubFile() {
    https.get(url, (res) => {
        res.pipe(fs.createWriteStream(pathClubsFile));
        res.on('end', () => {
            console.log('Fichier enregistré');
        });
    });
}

function getTeamFile(teamId, teamUrl) {
    console.log(teamUrl);
    https.get(teamUrl, (res) => {
        res.pipe(fs.createWriteStream(`${pathTeamsFile}/${teamId}.html`));
        res.on('end', () => {
            console.log(`Fichier ${teamId} enregistré`);
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
            var id = $(team).find('a.team-wrap')
                .attr('href').split('club')[2]
                .split('=')[1].split('/')[0];

            // Récupération du pays de l'équipe
            var country = $(team).find('span.team-name')
            .text().split('(')[1].split(')')[0];

            
            var logoUrl = $(team).find('.club-logo').attr('style').split('(')[1].split("'")[1];
            teamsInfo.push({'id':id, 'name':name, 'country':country, 'logoUrl':logoUrl});
            
            const writeStream = fs.createWriteStream(`${logoFolder}/${id}.png`);
            // Enregistre l'image dans le dossier public
            https.get(logoUrl, res => {
                res.pipe(writeStream);

                res.on('end', () => {
                    console.log('Fin du chargement');
                })
            })

            // Récupération des équipes
            // `${url}/club=${teamId}`
            // getTeamFile(teamId, `${url}/club=7889`);
            
        });
    });
}

fs.readFile(pathTeamsFile+'/7889.html', (err, file) => {
    if(err)console.log(err);
    const $ = cheerio.load(file.toString());
    var playerRole = null;
    var playerNum = null;
    var playerName = null;
    var playerSurname = null;
    
    var players = $('li.squad--team-player');
    players.toArray().forEach(player => {
        playerRole = $(player).find('span.squad--player-role').text();
        playerNum = $(player).find('span.squad--player-num').text();
        playerName = $(player).find('span.squad--player-name a').text();
        playerSurname = $(player).find('span.squad--player-name-surname a').text();
    });
    
});

// getTeamFile(7889, `${url}club=7889/`);
// getClubFile();
parseFile(pathClubsFile);
