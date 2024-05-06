const puppeteer = require('puppeteer');

async function scrapeProducts(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });  // Odottaa, että verkkoaktiviteetti rauhoittuu

    const products = await page.evaluate(() => {
        let items = [];
        // Varmistetaan, että elementtejä on olemassa ennen niiden käsittelemistä
        document.querySelectorAll('.t').forEach(item => {
            const titleElement = item.querySelector('.txt > a');
            const priceElement = item.querySelector('.txt div');
            const imageElement = item.querySelector('.k > a > img');
            if (titleElement && priceElement && imageElement) {
                const title = titleElement.innerText;
                const price = priceElement.innerText;
                const image = imageElement.src;
                items.push({ title, price, image });
            }
        });
        return items;
    });

    console.log(products);
    await browser.close();
    return products;
}

scrapeProducts('https://www.cosa.fi/vuokratuotteet/sekalaiset/');