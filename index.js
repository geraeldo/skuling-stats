import puppeteer from "puppeteer";
import { db } from "./firebase/config.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import("dotenv/config");

async function scrapeAndSaveStats() {
  console.log("Starting browser...");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    console.log("Logging in and navigating...");
    await Promise.race([
      page.goto("https://app.skuling.id/login", {
        waitUntil: "networkidle0",
      }),
      new Promise((resolve) => setTimeout(resolve, 20000)),
    ]);
    await page.type("#username", process.env.USERNAME);
    await page.type("#password", process.env.PASSWORD);
    const loginButtonText = "Log In";
    const loginButtonSelector = `button::-p-text("${loginButtonText}")`;
    await page.waitForSelector(loginButtonSelector, { visible: true });
    await page.click(loginButtonSelector);
    await page.waitForNavigation();

    await Promise.race([
      page.goto("https://app.skuling.id/stats", {
        waitUntil: "networkidle0",
      }),
      new Promise((resolve) => setTimeout(resolve, 30000)),
    ]);

    // Extract stats
    const stats = await page.evaluate(() => {
      const allStats = [];
      document
        .querySelectorAll('[data-chakra-component="CFlex"]')
        .forEach((container) => {
          const elements = container.querySelectorAll(
            '[data-chakra-component="CBox"]'
          );
          if (elements.length >= 2) {
            const key = elements[0].innerText;
            const value = elements[1].innerText;
            if (key && value) {
              allStats.push({ key, value: value.replace(/\./g, "") });
            }
          }
        });

      return allStats.reduce((acc, { key, value }) => {
        const cleanKey = key.replace(/\s+/g, " ").trim();
        const cleanValue = value.replace(/\s+/g, "").trim();
        return { ...acc, [cleanKey]: cleanValue };
      }, {});
    });

    console.log(stats);

    if (Object.keys(stats).length === 0) {
      console.log("No stats found, saving a screenshot...");
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
      await page.screenshot({ path: `no-stats-found_${timestamp}.png` });
    } else {
      const statsWithTimestamp = { ...stats, timestamp: serverTimestamp() };

      await addDoc(collection(db, "skuling-stats"), statsWithTimestamp);
      console.log("Stats saved to Firestore.");
    }
  } catch (error) {
    console.error("Failed to scrape stats or save to Firestore:", error);
  } finally {
    await browser.close();
  }
}

scrapeAndSaveStats().catch(console.error);
