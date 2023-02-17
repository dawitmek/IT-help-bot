const puppeteer = require("puppeteer");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MongoClient;

async function fetchUpcomingEvents(cronTime) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    client.connect(err => {
        console.error("error:", err);
    });

    const collection = client.db("IT-Help-Bot").collection("upcoming-events");

    try {
        const username = process.env.NPusername;
        const password = process.env.NPpass;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the login page
        await page.goto("https://npoweronline.org/login/index.php", {
            timeout: 60000,
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
            },
        });



        // Fill in the login form and submit it
        await page.type("#username", username);
        await page.type("#password", password);
        await page.click("#loginbtn", { delay: 300 });

        console.log('clicked on button');


        // Wait for the page to load after logging in
        await page.waitForNavigation();

        const cookies = await page.cookies();

        const contentpage = await browser.newPage();
        await contentpage.setCookie(...cookies);

        await contentpage.goto(page.url() + "course/view.php?id=611");

        const topics = await contentpage.$$eval('.block_calendar_upcoming .event > a', links => links.map(link => link.innerText));
        const times = await contentpage.$$eval('.block_calendar_upcoming .event .date', links => links.map(link => link.innerText + `, ${new Date(Date.now()).getFullYear()}`));

        let formatedTime = times.map(time => {
            if (time.toLowerCase().includes('today')) {
                let now = new Date(Date.now());
                let hour = time.toString().split(',')[1];

                new Date(`${now.toLocaleString('default', { weekday: 'long' })} ${now.toLocaleString('default', { month: 'long' })} ${now.getDate()} ${now.getFullYear()} ${hour}`);
            } else {
                return new Date(Date.parse(time)).toString();

            }
        });

        formatedTime.forEach(time => console.log(time))


        await collection.updateOne({ "name": 'upcoming-events' }, {
            $set: {
                "topic": [...topics],
                "times": [...formatedTime],
                "last-cron-job": cronTime,
            }
        }, { upsert: true })

        await browser.close();
        await client.close();
        return true;
    } catch (error) {
        console.error('ERROR Occured: ' + error);
        return false;
    }
};

module.exports = fetchUpcomingEvents;