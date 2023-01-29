import shortUrl from '../model/shortStore.js';
import { nanoid } from 'nanoid';
import validUrl from 'valid-url';
import moment from 'moment';
import URI from "uri-js";
import NodeCache from 'node-cache';


// create cache
const maxKeys = 5200
const myCache = new NodeCache({ maxKeys, recycleFreq: 5150 });


const fixURL = (url) => {
    if (!URI.parse(url).scheme) {
        return 'https://' + url;
    } else return url;
}

export const createShortURL = async (req, res) => {
    
    const longURL = req.body.full;
    const base_url = process.env.BASE_URL;
    
    // Check if Long URL is valid or not.
    if (!validUrl.isUri(fixURL(req.body.full))) 
    {
        return res.status(401).json({
            message: 'Unable to shorten that link. It is not a valid url!'
        })
    }

    try {
        /* If Long URL is valid, get the latest entry (longURL -> shortURL) from DB. 
            1. If it's found in DB, check the latest time when it was created. If >5 hours, create a new one in DB, add shortURL -> longURL in cache, and return shortURL to user.
            2. If not found in DB, create a new one in DB, add shortURL -> longURL in cache, and return shortURL to user.
        */
        const found = await shortUrl.find({ full: req.body.full }).sort({ createdAt: -1 }).limit(1);
        if (found.length > 0) 
        {
            let hours = moment().diff(moment(found[0].createdAt), 'hours');
            console.log("hours", hours)
            if (hours >= 5) {
                console.log("Found in DB. Since the timestamp > 5 hours, so, create a new one");
                const shortURL = await shortUrl.create({ full: longURL, short: nanoid(15) });
                console.log('shortURL', shortURL)

                const short_id = shortURL.short
                myCache.set(short_id, longURL);
                const short_url = base_url +"/"+ short_id;
                console.log(short_url);
                res.send(short_url);
            } 
            else 
            {
                console.log("Found in DB with timestamp < 5 hours");
                const short_id = found[0].short;
                const short_url = base_url +"/"+ short_id;
                console.log(short_url);
                res.send(short_url);
            }
        } 
        else 
        {
            console.log("Not found in DB. So, create a new one");
            const shortURL = await shortUrl.create({ full: longURL, short: nanoid(15) });
            console.log('shortURL', shortURL)
                
            const short_id = shortURL.short
            myCache.set(short_id, longURL);
            const short_url = base_url +"/"+ short_id;
            console.log(short_url);
            res.send(short_url);
        }
    }
    catch (err) 
    {
        console.log("Error: "+ err);
        res.status(501).json({
            message: 'Something went wrong! Please Try Again'
        })
    }
}


export const getShortURL = async (req, res) => {
    try 
    {
        //console.log("Cache content: "+myCache.keys());        
        const shortURL = req.params.shortUrl;
        console.log("Short URL: "+shortURL);

        // Check if shortURL -> longURL mapping is present in cache.
        const longURL = myCache.get(shortURL);        
        if(longURL)
        {
            console.log("Long URL found in cache: "+ longURL);
            res.redirect(fixURL(longURL));
        }
        else
        {
            // If not found in cache, check in DB. If shortURL -> longURL is found in DB, return longURL. If not found in DB, return error message.
            const short = await shortUrl.findOne({ short: shortURL });
            //console.log(short);
            if(short)
            {
                const longURL = short.full
                console.log("LongURL found in DB: "+longURL);
                res.redirect(`${fixURL(longURL)}`);
            }
            else
            {
                return res.status(401).json({
                    message: 'Short URL is not valid. Please check the URL and try again.'
                });
            }
        }
        
    } 
    
    catch (err) 
    {
        console.log(err);
        res.sendStatus(404);
    }
}