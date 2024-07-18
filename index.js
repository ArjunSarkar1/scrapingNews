// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const setArticles = 100; // can be changed!
let allNewsArticles = []

async function sortHackerNewsArticles() {

  try {
    // launch browser
    console.log("\n> Launching web browser...")
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // creating the file path for the txt
    const txtFilePath = path.join(__dirname, "showNewsArticles.txt");

    // go to Hacker News
    console.log("\n> Heading to the directed page...")
    await page.goto("https://news.ycombinator.com/newest");
    await page.waitForTimeout(1000);

    // clearing the entire file before writing to it
    fs.writeFileSync(txtFilePath,"");

    console.log("\n> Extracting the first 100 news articles...");
    await getNewsArticles(page, setArticles, allNewsArticles, txtFilePath);

    console.log(`\n> All ${allNewsArticles.length} news articles have been extracted...`)

    console.log(`\n> Validating if they are sorted from newest to oldest...\n`)
    const check = sortingValidation(allNewsArticles);

    if ( check ) {
      console.log("> The news articles are in order!");
    } else {
      console.log("> The news articles are NOT in order!");
    }

    console.log("\n*** Open the `showNewsArticles.txt` in the current directory to see the articles ***");

    // closing web browser
    console.log("\n> Closing web browser...");
    await browser.close();

  } catch (error) {
    console.log("\n> ERROR: check your website accessibility or your internet.\nDetails:\n", error);
  }
}

/**
 * The sole purpose of this function is to retrieve news articles from the webpage, extract relevant information
 * such as title, author, URL, and date, and handles pagination to load more articles until a specified
 * number is reached.
 * @param currPage - `currPage` is a parameter representing the current page in a web browser where the
 * news articles are being fetched and processed
 * @param setArticles - The `setArticles` parameter in the `getNewsArticles` function represents the
 * total number of news articles that you want to retrieve; how many articles
 * will be fetched from the website until reaching the desired total count.
 * @param allNewsArticles - The `allNewsArticles` parameter in the `getNewsArticles` function is an
 * array that stores all the news articles that have been retrieved so far. This array will be updated
 * with new articles fetched from the webpage until the total number of articles reaches the specified
 * `setArticles` value.
 */
async function getNewsArticles(currPage, setArticles, allNewsArticles, txtFilePath) {

  const newsArticles = async ({setArticles, allNewsArticles}) => {
    // Converting all time in minutes for readability and comprehension purposes!
    function relativeTime(dateTime) {
      const timeString = dateTime.trim().split(" ");
      const numerical = timeString[0];
      const time = timeString[1];
  
      if ( time === "seconds" || time === "second" ) {
        return parseInt(numerical) / 60;
  
      } else if ( time === "minutes" || time === "minute"  ) {
        return parseInt(numerical);
  
      } else if ( time === "hours" || time === "hour" ) {
        return parseInt(numerical) * 60;
  
      } else if ( time === "days" || time === "day" ) {
        return parseInt(numerical) * 60 * 24;
  
      } else if ( time === "months" || time === "month" ) {
        return parseInt(numerical) * 60 * 24 * 30; 
      }
      return 0;
    }
  
    const articles = [];
    const articleElements = document.querySelectorAll(".athing");
    for (let i = 0; i < Math.min(articleElements.length, setArticles - allNewsArticles.length); i++) {
      const titleElement = articleElements[i].querySelector(".titleline a");
      const subtextElement = articleElements[i].nextElementSibling.querySelector(".subtext");
      const authorElement = subtextElement.querySelector(".hnuser");
      const dateElement = subtextElement.querySelector(".age");
  
      const article = {
        title: titleElement ? titleElement.innerText : "No title",
        author: authorElement ? authorElement.innerText : "No author",
        url: titleElement ? titleElement.href : "No URL",
        webDate: dateElement ? dateElement.innerText : "No Date",
        date: dateElement ? relativeTime(dateElement.innerText) : "No Date", // used for sorting (minutes)
      };
      articles.push(article);
    }
    return articles;
  };
  
  const loadNextPage = async () => {
    console.log("\n> Loading next page...");

    try {
      if ( await currPage.$("a.morelink") ) {
        currPage.click("a.morelink")
        await currPage.waitForTimeout(1000); // giving some time to load  
      } else {
        throw new Error("Unable to load more pages.")
      }
    } catch (error) {
      console.log("\n> ERROR: no more pages found\nDetails:\n>", error.message);
      return false;
    }
    return true;
  };

  let index = 0;
  while ( allNewsArticles.length < setArticles ) {
    try {
      const currentArticles = await currPage.evaluate(newsArticles, {setArticles, allNewsArticles, txtFilePath});
      allNewsArticles.push(...currentArticles); // unpacking currentArticles and adding them individually!
  
      // Appending to txt file
      currentArticles.forEach((article) => {
          const articleData = `News #${++index}\nDate/Time: ${article.webDate}\nTitle: ${article.title}\nAuthor: ${article.author}\nUrl: ${article.url}\n\n`;
          fs.appendFileSync(txtFilePath, articleData);
      });
  
      if ( allNewsArticles.length < setArticles ) {
        const checkPage = await loadNextPage();
        if ( !checkPage ) {
          break;
        }
      }
      
    } catch (error) {
      console.log("\n> ERROR: failed to retrieve articles.");
      break;
    }
  }
}

/**
 * The main purpose of this funtion is to check if a given array of 
 * news articles is sorted by date in descending order.
 * @param theArticles - The function `sortingValidation` is checking if the
 * `theArticles` array is sorted form newest to oldest order based on the `date` property of 
 * each article. The function will return `true` if the array is sorted in that manner, and `false` otherwise.
 * @returns The function `sortingValidation` is checking if the `newsArticles` array is sorted in newsest to 
 * oldest returning `true` if so, and `false` otherwise.
 */
function sortingValidation(theArticles) {
  let index = 1;
  let loop = true;
  while ( index < theArticles.length && loop ) {
    if ( theArticles[index-1].date > theArticles[index].date ) {
      loop = false;
    }
    index++;
  }
  return loop;
}

(async () => {
  await sortHackerNewsArticles();
})();
