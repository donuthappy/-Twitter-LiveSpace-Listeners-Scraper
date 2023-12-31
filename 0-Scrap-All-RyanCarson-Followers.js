const puppeteer = require('puppeteer');
const chromePaths = require('chrome-paths');
const Chrome_Browser_PATH = chromePaths.chrome;
var fs = require("fs");
const _ = require('lodash');
const fetch = (...args) => import ('node-fetch').then(({default: fetch}) => fetch(...args));

var finalset = [];
const getusers = async () => {
    const browser = await puppeteer.launch({
        executablePath: Chrome_Browser_PATH,
        headless: true,
        args: [
            "--disable-infobars", "--no-sandbox", "--disable-blink-features=AutomationControlled", '--start-maximized'
        ],
        ignoreDefaultArgs: ["--enable-automation"]
    });

    console.log("running with headless mode");
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.setViewport({width: 1920, height: 1000});
    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if (req.resourceType() === 'image') {
            req.abort();
        } else {
            req.continue();
        }

    });

    var rs = [];
    page.on("request", async (request) => {


        if (request.url().includes('https://api.twitter.com/graphql/KwJEsSEIHz991Ansf4Y1tQ/Followers')) { // console.log(request);
            try {
                var target_profile_url = request.url();
                var crftoken = request.headers();
                rs.push(crftoken);
                var Profile_url = await page.evaluate(() => {
                    return window.location.href;
                });

                var crf = await page.evaluate(() => {
                    var data = document.cookie;
                    data = data.split(";");
                    return data;

                });

                var a1 = [];
                var a2 = [];
                a1.push(rs[0]);
                a2.push(rs[1]);
                var hd = [
                    ... a1,
                    ... a2
                ];


                var headerString = JSON.stringify(hd);


                headerString = headerString.replace("},{", ",");

                var headerStringor = headerString.replace(`origin`, "'origin'");

                var headerStringr = headerStringor.replace('referer', "'referer'");
                var headerStringas = headerStringr.replace('accept', "'accept'");
                headerStringas = headerStringas.replace(`[`, '');
                headerStringas = headerStringas.replace(`]`, '');


                var hdr = JSON.parse(headerStringas);

                var parsed = await fetch(target_profile_url, {
                    "headers": hdr,
                    "body": null,
                    "method": "GET"
                }).then(response => response.json()).then(data => {
                    return data
                })

                var listOfusers = parsed.data.user.result.timeline.timeline.instructions[0].entries;
                if (listOfusers) {


                    var len = listOfusers.length;
                    len = len - 2;

                    for (let items = 0; items < len; items++) {


                        const profile_name = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.name;
                        const username = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.screen_name;
                        var attached_link = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.entities.url;
                        if (attached_link) {
                            attached_link = attached_link.urls[0].expanded_url;
                        } else {
                            attached_link = 'no data available';
                        }
                        const joindate = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.created_at;
                        const location = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.location;
                        const Tweets = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.statuses_count
                        const followers = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.followers_count;
                        const following = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.friends_count;
                        var verified_blue_badge = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.is_blue_verified
                        var AccountVerified = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.verified;


                        if (AccountVerified) {
                            AccountVerified = 'yes';
                        } else {
                            AccountVerified = 'no';
                        }


                        if (verified_blue_badge) {
                            verified_blue_badge = 'yes';
                        } else {
                            verified_blue_badge = 'no';
                        }
                        const favourites_count = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.favourites_count;
                        const profile_image_url = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.profile_image_url_https;
                        var profile_banner = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.profile_banner_url;

                        if (profile_banner) {
                            profile_banner = profile_banner;
                        } else {
                            profile_banner = 'no data available';
                        }

                        const description = parsed.data.user.result.timeline.timeline.instructions[0].entries[items].content.itemContent["user_results"].result.legacy.description;
                        finalset.push({
                            profile_url: `https://twitter.com/${username}`,
                            profile_name: profile_name,
                            username: '@' + username,
                            joindate: joindate,
                            location: location,
                            Tweets: Tweets.toString(),
                            followers: followers.toString(),
                            following: following.toString(),
                            verified_blue_badge: verified_blue_badge,
                            AccountVerified: AccountVerified,
                            favourites_count: favourites_count.toString(),
                            profile_image_url: profile_image_url,
                            profile_banner: profile_banner,
                            profile_attached_link: attached_link,
                            description: description

                        });
                    }
                }


                var dataset = _.uniqBy(finalset, 'profile_url');

                fs.writeFileSync('Data/ryan-carson-followers.json', JSON.stringify(dataset));
                console.log("total scraping Followers = " + dataset.length);

                if (dataset.length > 149500) {
                    browser.close();

                }

            } catch (error) {
                console.log("no data found");
            }
        } // end if
    });


    const cookiesFilePath = "twitter-cookies.json";

    const previousSession = fs.existsSync(cookiesFilePath);
    if (previousSession) { // If file exist load the cookies
        const cookiesString = fs.readFileSync(cookiesFilePath);


        if (cookiesString != '') {
            const parsedCookies = JSON.parse(cookiesString);
            if (parsedCookies.length !== 0) {
                for (let cookie of parsedCookies) {
                    await page.setCookie(cookie);
                }

                console.log('Session loaded');
            }
        }
    }


    await page.evaluateOnNewDocument(() => {

        Object.defineProperty(navigator, 'maxTouchPoints', {
            get() {
                "¯\_(ツ)_/¯";
                return 1;
            }
        });

        "✌(-‿-)✌";
        navigator.permissions.query = i => ({
            then: f => f(
                {state: "prompt", onchange: null}
            )
        });

    });


    await page.goto('https://twitter.com/ryancarson/followers', {
        waitUntil: 'load',
        timeout: 0
    });

    const NewcookiesFilePath = "twitter-cookies.json";
    // Save Session Cookies
    const cookiesObject = await page.cookies();
    // Write cookies to temp file to be used in other profile pages
    fs.writeFile(NewcookiesFilePath, JSON.stringify(cookiesObject), function (err) {
        if (err) {
            console.log("The file could not be written.", err);
        }
        console.log("Session saved");
    });
    await page.waitForSelector('[aria-label="Timeline: Followers"]');
    console.log("please wait...listing users profile");

    var all = await page.evaluate(async () => {
        await new Promise((resolve, reject) => {

            var prev_height = 0;
            var distance = 950;
            var countFails = 0;
            var timer = setInterval(() => { //


                var scrollHeight = document.body.scrollHeight;

                if (prev_height == scrollHeight) {
                    countFails++;
                } else {
                    countFails = 0;
                }


                window.scrollBy(0, distance);
                prev_height = document.body.scrollHeight;

                var bodytext = document.querySelector('body').innerText;
                if (bodytext.includes('Something went wrong. Try reloading.')) {
                    var buttons = document.querySelectorAll('span>span');
                    var clicked = false;

                    for (var index = 0, numBtn = buttons.length; index < numBtn; ++ index) {
                        if (/Retry/i.test(buttons[index].textContent)) {
                            buttons[index].click();
                            clicked = true;
                            break;
                        }
                    }
                }

                console.clear();


                // if (countFails == 30) {
                // clearInterval(timer);
                // resolve();
                // }
            }, 600);
        });


    }); // end loading data


    await browser.close();

};

getusers();
