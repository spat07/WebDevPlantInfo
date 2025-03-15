import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import axios from "axios";


class PalntInfo {
    constructor(id, name, imageUrl, description) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.description = description;
    }
}

const port = 3000;
const API_URL = "https://perenual.com/api/v2"
const yourkey = "sk-Wr7q67d3b0ee1abe89150";
const maxPages = 3; // this to control number of requests per day
const pageRange = 15; // maxPages from pageRange to purge

var cachedPages = 0;
var pageList = [];
var pageCache = {};

const app = express();

// run local server
app.listen(port, ()=> {
    console.log(`running server at port : ${port}`);
});

// set some deps
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

// generate randome list of maxPages
// for (let i = 0 ; i < maxPages; i++) {
while(pageList.length < maxPages) {
    let pageIdx = Math.floor(Math.random() * pageRange) + 1;
    // console.log(`next idx ${pageIdx}`);
    if(pageList.includes(pageIdx)) { //duplicate
        continue;
    } else {
        pageList.push(pageIdx);
        // console.log(`next add ${pageIdx} to PageList`);
    }
}

console.log(`Page list : ${pageList}`);

// manage initial GET request to send updated data
app.get("/", (req, res)=>{
    console.log(`receveied GET request`);
    res.render('page.ejs');
});

app.post("/viewpage", async (req, res)=>{
    console.log(req.body)
    
    if(req.body.type == 'random'){
        console.log(`receveied request for random plant`);

        // request random plant
        var pageData = null;
        var pageId = null;
        if (cachedPages == maxPages) {
            // all pages are cached
            pageId = pageList[Math.floor(Math.random() * maxPages)];
            console.log(`using cahed data of page ${pageId} :`);
            // console.log(`${JSON.stringify(pageCache[pageId])}`);
        } else {
            pageId = pageList[cachedPages]; //next page to cache
            console.log(`sending req to ${API_URL}/species-list/ for page ${pageId}`)
            try {
                const response = await axios.get(
                    API_URL + "/species-list",
                    {
                        params: {
                            key: yourkey,
                            page: pageId,
                        }
                    }
                );
                // add data in page cache
                pageCache[pageId] = response.data;
                cachedPages++;
                console.log(`received page data for ${pageId}, total cachedPages ${cachedPages}`);
            } catch (error) {
                console.log(error.message);
                console.log(`retrieving from local cache!`)
                if (pageCache.length) {
                    // handle it from the cached data ?
                    pageId = pageList[Math.floor(Math.random() * pageCache.length)];
                } else {
                    console.log(`local cache is empty , Error!`);
                    res.status(404).send(error.message);
                }
            }
        }

        pageData = pageCache[pageId];

        // extract required information
        let entriesPerPage = pageData.per_page;

        let plantId = Math.floor(Math.random() * entriesPerPage); //entries start from 1
        let plantInfo = pageData.data[plantId];
        console.log(`plantId ${plantId}`);
        console.log(plantInfo);

        res.render('page.ejs', {data : plantInfo});
    } else {
        console.log(`receveied request for indian plant, but yet not supported!`);
        res.render('page.ejs');
    }
});
