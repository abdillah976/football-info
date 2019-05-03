const fs = require('fs');
const cheerio = require('cheerio');
const https = require('https');

const url = 'https://fr.uefa.com/uefachampionsleague/season=2019/clubs/';
const pathClubsFile = './parse/clubs.html';

function getClubFile() {
    https.get(url, (res) => {
        res.pipe(fs.createWriteStream(pathClubsFile));
        res.on('end', () => {
            console.log('Fichier enregistré');
        });
    });
}

function parseFile(path) {
    fs.readFile(path, (err, file) => {
        if(err)console.log(err);
        const $ = cheerio.load(file.toString());
        
        var teams = $('div.team-is-club');
        var teamsInfo = [];
        
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
            console.log(logoUrl);
            teamsInfo.push({'id':id, 'name':name, 'country':country, 'logoUrl':logoUrl});
            
            const writeStream = fs.createWriteStream(`./public/logo/${id}.png`);
            // Enregistre l'image dans le dossier public
            https.get(logoUrl, res => {
                res.pipe(writeStream);

                res.on('end', () => {
                    console.log('Fin du chargement');
                })
            })
        });
    });
}

// getClubFile();
parseFile(pathClubsFile);
