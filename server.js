require("dotenv").config();
const {v4: uuidv4 } =require("uuid")
const twilio = require("twilio")
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const express = require("express");
const app = express()
const port = 5000;

 // use the express JSON middleware
 app.use(express.json())

 // Create the twilioClient
 
 const twilioClient = twilio(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    {accountSid: process.env.TWILIO_ACCOUNT_SID}
 )

 const findOrCreateRoom = async (roomName) => {
    try {
        // see if the room exists already. If it doesn't, this will throw
        // error 20404.
        await twilioClient.video.v1.rooms(roomName).fetch();
    } catch(error){
        if(error.code = 20404){
            await twilioClient.video.v1.rooms.create({
                uniqueName: roomName,
                type: "go",
            });
        } else {
            // let another error bubble up
            throw error;
        }
    }
 }

 const getAccessToken = (rootName) => {
    // create an accessToken
    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY_SID,
        process.env.TWILIO_API_KEY_SECRET,
        //generate a random unique identify for this participant
        {identity: uuidv4()}
    );

    // create a video grant for this specific room
    const videoGrant = new VideoGrant({
        room: rootName
    });

    //add the video grant
    token.addGrant(videoGrant);
    // serialize the token and return it
    return token.toJwt();
 }

 app.post("/join-room", async (req, res) => {
    // return 400 if the request has an empty body or no roomName
    if(!req.body || !req.body.roomName ){
        return res.status(400).send("Must include rootName argument.");
    }

    const roomName = req.body.roomName;
    // find or create a room with a given roomName
    findOrCreateRoom(roomName);
    // generate a access Token for a participant in this room 
    const token = getAccessToken(roomName);
    res.send({
        token: token
    });
 });

 // sserve static files from the public directory
 app.use(express.static("public"));

 app.get("/", (req, res) =>{
    res.sendFile("public/index.html");
 });
 

 app.listen(port, () => console.log(`Express server running on port ${port}`));