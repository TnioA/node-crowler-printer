import { definition } from "./definition.js";
import fs from "fs";

// ***
// forces the application to wait
// ***
export async function sleep(sleepTime) {
    console.log(`Sleeping for ${sleepTime / 1000} seconds`);
    await new Promise(resolve => setTimeout(resolve, sleepTime));
}

// ***
// try to login to some service
// ***
export async function login(page) {
    console.log("Logging in...");
    await page.goto(`https://login.pearson.com/v1/piapi/piui/signin?client_id=bWPoUiRnLpUhX2rhGeP4AaLCeyQYNYDA&login_success_url=https:%2F%2Fenglish-dashboard.pearson.com%2Fies-session%3FiesCode%3Dq6QNUruiRF`);

    await sleep(2000);

    // waiting for username field
    await page.waitForSelector('#username', { visible: true });

    // typing username
    const usernameField = await page.$('#username');
    await usernameField.click();
    await usernameField.type(definition.userName);

    // typing password
    const passwordField = await page.$('#password');
    await passwordField.click();
    await passwordField.type(definition.password);

    await sleep(2000);

    // trying login
    const loginBtn = await page.$('#mainButton');
    await loginBtn.click();

    await sleep(2000);

    return page;
}

// ***
// access the book list
// ***
export async function getUnities(page, bookUrl) {
    // TODO:
    console.log("Getting the unities");
    await page.goto(bookUrl);

    // waiting for username field
    await page.waitForSelector('.toc-node__card', { visible: true });

    // typing username
    const units = await page.$$('.toc-node__card');

    let unitsUrl = [];
    for await (const res of units) {
        const url = await page.evaluate(el => el.getAttribute("href"), res);
        unitsUrl.push(url);
    };
}

export async function getUnitExercieUrls(page, url) {
    // TODO:
    console.log("Getting exercise Urls");

    // Going to the page
    await page.goto(url);

    await page.waitForSelector(".toc-lesson-node__button.toc-lesson-node__button--blue", { visible: true });

    const exercises = await page.$$(".toc-lesson-node__button.toc-lesson-node__button--blue");

    let urls = [];

    for await (const res of exercises) {
        const url = await page.evaluate(el => el.getAttribute("href"), res);
        urls.push("https://english-dashboard.pearson.com" + url);
    };

    return urls;
}

// ***
// process each exercise screen
// ***
export async function processExercise(page, url) {
    // TODO:
    console.log("Processing exercise");

    // Going to the page
    await page.goto(url);

    await sleep(3000);

    // waiting for the marker
    await page.waitForSelector(".marker.ng-star-inserted", { visible: true });

    // clicking to the marker
    const openner = await page.$$(".pef-foc-control-action__icon");
    // await openner[3].click();

    const exerciseItems = await page.$$(".lesson-activities-map__marker.ng-star-inserted");

    for await (const item of exerciseItems) {
        await item.click();
        await sleep(3000);

        var exerciseTitle = "";

        const titles = await page.$$(".section.ng-star-inserted");
        titles.shift();
        for await (const title of titles) {
            exerciseTitle = exerciseTitle + "-" + await title.evaluate(el => el.textContent);
        }

        exerciseTitle = exerciseTitle.replace("-", "").replaceAll(" ", "-").replaceAll(",", "");

        var hasExerciseFinished = false;
        var count = 1;

        await page.waitForSelector('iframe');

        while (!hasExerciseFinished) {
            const iframeHandle = await page.$("iframe");
            const iframe = await iframeHandle.contentFrame();

            const btnForward = await iframe.$("#btn_forward");
            const btnNextAnswer = await iframe.$(".btn-next-answer");

            const btnNextAnswerExists = await iframe.evaluate(() => !document.querySelector(".btn-next-answer").getAttribute("style").includes("none"));
            console.log("btnNextAnswerExists", btnNextAnswerExists);

            const btnForwardIsInactive = await elementHasClass(btnForward, "inactive_button");
            const btnNextAnswerIsInactive = await elementHasClass(btnNextAnswer, "inactive_button");

            const bookType = await page.evaluate(() => document.querySelector(".switch-box-item.switch-box-item--selected > input").getAttribute("value"));

            const bookTypePath = bookType === 'STUDENT_BOOK' ? 'StudentBook' : 'WorkBook';

            var path = `${definition.screenshotPath}/Roadmap/A2/Unit 1/${exerciseTitle}/${bookTypePath}`;
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path, { recursive: true });
            }

            await page.screenshot({ path: `${path}/${exerciseTitle}-${count}.png` });

            if (!btnNextAnswerExists) {
                if (btnForwardIsInactive) {
                    hasExerciseFinished = true;
                }
                else {
                    await btnForward.click();
                    await sleep(1000);
                }
            }
            else {
                await btnNextAnswer.click();

                if (btnNextAnswerIsInactive) {
                    if (btnForwardIsInactive) {
                        hasExerciseFinished = true;
                    }
                    else {
                        await btnForward.click();
                        await sleep(1000);
                    }
                }
            }

            count++;
        }

        await openner[3].click();
        await sleep(3000);
    }
}

export async function ScrollDown(page) {
    await page.evaluate(async () => {
        let scrollPosition = 0
        let documentHeight = document.body.scrollHeight

        while (documentHeight > scrollPosition) {
            window.scrollBy(0, documentHeight)
            await new Promise(resolve => {
                setTimeout(resolve, 1000)
            })
            scrollPosition = documentHeight
            documentHeight = document.body.scrollHeight
        }
    })
}

export async function elementHasClass(el, className) {
    try {
        const classNames = (
            await (await el.getProperty('className')).jsonValue()
        ).split(/\s+/);

        return classNames.includes(className);
    } catch (exception) {
        return false;
    }
}