/**
 * popup.js is the script that runs in the extension popup window.
 * It handles user interactions and communicates with content scripts
 * through DOM events and Chrome's messaging API.
 */
document.getElementById("goFollowers").onclick = async() => {
    const username = document.getElementById("username").value.trim();
    if(!username) return alert("Ensure you're logged into Instagram and Enter a Username:"); //if they just press go to profile without typing username

    const url = `https://www.instagram.com/${username}/followers/`;

    const[tab]= await chrome.tabs.query({active: true, currentWindow: true}); //hey chrome what tabs you looking at
    chrome.tabs.update(tab.id, {url});//hey chrome change it to go to the users profile
}

const followersStatus = document.getElementById("followersStatus");
const followingStatus = document.getElementById("followingStatus");
const showResultsBtn = document.getElementById("getNotFollowingBack");

let followersDone = false;
let followingDone = false;

/**
 * If both followers and following collected then it works
 * returns true or false
 */
function checkReady() {
    if(followersDone && followingDone){
        showResultsBtn.disabled = false;
    }
}

//when clicking follower button tells google to send message to content.js to start collecting followers
//displays the yellow loading thing and when done changes to complete
document.getElementById("collectFollowers").onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    followersStatus.className = "status loading";
    followersStatus.textContent = "Loading...";

    chrome.tabs.sendMessage(tab.id, { type: "collectFollowers" }, () => {
        followersDone = true;
        followersStatus.textContent = "COMPLETE";
        followersStatus.className = "status complete";
        checkReady(); //incase someone did it backwards
    });
};

//exact same thing as above but for following
document.getElementById("collectFollowing").onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true});

    followingStatus.className = "status loading";
    followingStatus.textContent = "Loading...";

    chrome.tabs.sendMessage(tab.id, { type: "collectFollowing" }, () => {
        followingDone = true;
        followingStatus.textContent = "COMPLETE";
        followingStatus.className = "status complete";
        checkReady(); //followers and following should be ready to extract
    });
};

//when clicking show results button sends message to content.js to show the overlay with results
//with some error messages incase user skips steps
document.getElementById("getNotFollowingBack").onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    
    chrome.tabs.sendMessage(tab.id, { type: "getNotFollowingBack" }, res => {
        if(!res || !res.result) {
            alert("No data yet. Collect followers and following first");
            return;
        }
        
        chrome.tabs.sendMessage(tab.id, {
            type: "showResultsOverlay",
            users: res.result
        });
    });
    //all memory work should be done in content.js not in popup.js

};
























