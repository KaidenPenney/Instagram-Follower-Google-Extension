document.getElementById("goFollowers").onclick = async() => {
    const username = document.getElementById("username").value.trim();
    if(!username) return alert("Ensure you're logged into Instagram and Enter a Username:");

    const url = `https://www.instagram.com/${username}/followers/`;

    const[tab]= await chrome.tabs.query({active: true, currentWindow: true}); //hey chrome what tabs you looking at
    chrome.tabs.update(tab.id, {url});//hey chrome change it to follower tab
}

const followersStatus = document.getElementById("followersStatus");
const followingStatus = document.getElementById("followingStatus");
const showResultsBtn = document.getElementById("getNotFollowingBack");

let followersDone = false;
let followingDone = false;

function checkReady() {
    if(followersDone && followingDone){
        showResultsBtn.disabled = false;
    }
}

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
























