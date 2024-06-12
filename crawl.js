const cheerio = require('cheerio');
const request = require('request-promise');
const fs = require('fs');

let filmIdName = [];

for(let i = 20; i <= 21; i++) {
    let url;
    if(i === 0) {
        url = "https://www.the-numbers.com/box-office-records/worldwide/all-movies/cumulative/all-time"
    }
    else {
        url = `https://www.the-numbers.com/box-office-records/worldwide/all-movies/cumulative/all-time/${i}01`
    }
    request(url)
    .then((html) => {
        let promises = [];
        let filmData = [];
        const $ = cheerio.load(html);
        $('tr').each((i, elem) => {
            if(i === 0) return;
            const filmName = $(elem).find('td').eq(2).html().split('"')[1].split('"')[0];
            filmIdName.push(filmName);
        });

        filmIdName.forEach((filmId) => {
            promises.push(
                request(`https://www.the-numbers.com${filmId}`)
                    .then((html) => {
                        const $ = cheerio.load(html);
                        const title = $('h1').first().text().split('(')[0].trim();
                        if(title === "") return;
                        const summary_table = $('table').eq(2);
                        const openingWeekend = summary_table.find('tr').eq(0).find('td').eq(1).text().split(' ')[0];
                        const budget = summary_table.find('tr').eq(3).find('td').eq(1).text().split(' ')[0];
                        const openingTheaterCount = summary_table.find('tr').eq(4).find('td').eq(1).text().split(' ')[0];
                        const movie_detail_table = $('table').eq(5);
                        let offset = -1;
                        if(movie_detail_table.find('tr').eq(1).find('td').eq(0).text().includes('International')) {
                            offset = 0;
                        }
                        const releaseDate = movie_detail_table.find('tr').eq(2 + offset).find('td').eq(1).text().split('by')[0].trim();
                        const MPAA_rating = movie_detail_table.find('tr').eq(3 + offset).find('td').eq(1).text().split(' ')[0];
                        if (movie_detail_table.find('tr').eq(5 + offset).find('td').eq(0).text() !== 'Franchise:')
                            offset -= 1;
                        const language = movie_detail_table.find('tr').eq(14 + offset).find('td').eq(1).text();
                        filmData.push({
                            title,
                            openingWeekend,
                            budget,
                            openingTheaterCount,
                            releaseDate,
                            MPAA_rating,
                            language
                        });
                        console.log("Crawled: ", title)
                    })
            );
        });

        Promise.all(promises)
            .then(() => {
                console.log(`Write to film-data-${i}.json`);
                fs.writeFileSync(`film-data-${i}.json`, JSON.stringify(filmData, null, 2));
            });
    })
    .catch((err) => {
        console.log(err);
    });
}

