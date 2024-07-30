import puppeteer from "puppeteer";
import { sleep, login, getUnities, getUnitExercieUrls, processExercise } from "./methods.js";
import { definition } from "./definition.js";

// default method
async function processAsync() {
    // starting the process
    console.log("- Process started");
    const browser = await puppeteer.launch({ headless: definition.hiddenBrowser, defaultViewport: null });

    const page = await browser.newPage();
    if(definition.viewPortSize)
        await page.setViewport(definition.viewPortSize);

    await login(page);

    var unityExerciseUrls = await getUnitExercieUrls(page, "https://english-dashboard.pearson.com/toc/roadmap-a2/lessons/roadmap-a2%7C2.6.7%7Cu-U01/book#bd10582d-1730-46b0-b9fb-31983be0b95b");
    
    // await processUnit(page, "https://english-dashboard.pearson.com/toc/roadmap-a2/lessons/roadmap-a2%7C2.6.7%7Cu-U01/book?lessonUid=roadmap-a2%7C2.6.7%7Cu-U01%7Cu-U01-l-AD&activityId=96a241fd-1997-4352-bd9e-ee45ec02ffb9&isActivityPreview=0&bookType=STUDENT_BOOK&pageView=true");

    for await(const url of unityExerciseUrls) {
        await processExercise(page, url);
    }

    // await processExercise(page, unityExerciseUrls[0]);
    
    // finishing the process
    await browser.close();
    console.log("- Process finished");
};

processAsync();