console.log("if you see this the script properly injected");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * This method uses an autoscroll to find and take all
 * the usernames in a follower/folllowing list on instagram
 * It triggers the scrollers in the container and repeats
 * every second scrolling ot the bottom to load more usernames
 * and collect them in an array.
 * @returns list of usernames
 */
async function collectAllUsernames(){
    const scrollContainer =
        document.querySelector('div[role="dialog"] div.x6nl9eh.x1a5l9x9.x7vuprf.x1mg3h75.x1lliihq.x1iyjqo2'); //this is the scroller 
    if(!scrollContainer) {
        console.log("insta changed classes so needs to be updated.");
        return [];
    }
    let prevCount = 0;
    let sameCountTries = 0; //this is "How many times in a row did 
    // //scrolling fail to load new users" so when it reaches 3 typically means
    //all users have been loaded

    const usernames = new Set();

    while(sameCountTries < 3){
        //start extracting the users
        [...document.querySelectorAll("a[href^='/']")] //this takes in all username strings
            .map(a => a.getAttribute("href"))
            .filter(href =>
                href.split("/").length === 3 && // 3 because ["", username, ""] and get rid of rest of slashes
                !href.includes("accounts") &&
                !href.includes("explore") &&
                !href.includes("reels") &&//get rid of unnecessary info
                !href.includes("direct") &&
                !href.includes("p/")
            )
            .map(href => href.replaceAll("/", ""))//get rid of slashes
            .forEach(username => usernames.add(username));//add username in set

            console.log(`Collected: ${usernames.size}`);
            //now scroll down since all of these were collected
            const previousScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            await sleep(1000);

            if(scrollContainer.scrollHeight === previousScrollHeight){
                sameCountTries++; //try again 3 total attempts
                scrollContainer.scrollTop += 600; //extra kick if needed
                await sleep(700); //extra time if needed
            }
            else{
                sameCountTries = 0;
                prevCount = usernames.size; //nice now reapeat
            }
    }       

    console.log("Complete. Total unique:", usernames.size);
    return [...usernames]; //return the array of the usernames
}

//initialize the state of followers and following
const state = {
    followers: null,
    following: null
};

//collect followers
async function collectFollowers(){
    console.log("Collecting Followers...")
    state.followers = await collectAllUsernames();
    console.log("Followers collected:", state.followers.length);
}

//collect following
async function collectFollowing(){
    console.log("Collecting Following...");
    state.following = await collectAllUsernames();
    console.log("Following collected:", state.following.length);
}

/**
 * This function makes sure you have an array of followers and following
 * before continuing. Then, it filters out your following list
 * so if something is in following but not in followers, it return that
 * back in a separate array list.
 * @returns the people you follow but don't follow you back
 */
function getNotFollowingBack(){
    if(!state.followers || !state.following){
        console.log("Need both followers and following.");
        return [];
    }

    //everything not found in follwers will return here
    const followersSet = new Set(state.followers);
    return state.following.filter(
        user => !followersSet.has(user)
    );
}



//this is all for it to work in chrome extension
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("Received message:", msg);//see if chrome gets response

    if(msg.type === "collectFollowers"){
        collectFollowers().then(() => sendResponse({ success: true}));
        return true;
    }

    if(msg.type === "collectFollowing"){
        collectFollowing().then(() => sendResponse({ success: true}));
        return true;
    }

    if(msg.type === "getNotFollowingBack"){
        const result = getNotFollowingBack();
        sendResponse({ result }); //send in our list
        return true; //must return true for chrome
        /*
        This is because popup sends message, chrome opens temporary communication
        channel, and if it doesn't return true, chrome assumes no async response
        and the channel closes immediately not allowing for answer.
        */
    }

    if(msg.type === "showResultsOverlay"){
        try{
            showOverlay(msg.users);
        }catch(e){
            console.error("Overlay wont show", e);
        }
        //no send response needed so no return true needed
    }

})



/**
 * This fucntion creates an overlay, essentially a popup to the popup box
 * that displays a list of all the usernames past in it that aren't follwing back
 * theres a lot of html and css in here because we can't use our acutal popup.html
 * or css for it.
 * @param users is the array of usernames to show in overlay
 */
function showOverlay(users) {
    const overlay = document.createElement("div");
    overlay.id = "insta-overlay";
    overlay.innerHTML = `
        <h3>Not Following Back (${users.length})</h3>
        <button id="closeOverlay">Close</button>
        <div class="list" style="
            max-height: 340px;
            overflow-y: auto;
            margin-top: 8px;
        ">
        ${users.map(u => `<div class="user">${u}</div>`).join("")}
        </div>
    `;

    //styles for popup box
    overlay.style.position = "fixed";
    overlay.style.top = "10%";
    overlay.style.right = "10px";
    overlay.style.left = "auto";
    overlay.style.width = "300px";
    overlay.style.maxHeight = "70%";
    overlay.style.background = "#1f1f1f";
    overlay.style.color = "white";
    overlay.style.fontFamily = "'Lucida Console', Monaco, monospace";
    overlay.style.fontWeight = "700";
    // use a very large z-index to avoid being hidden by page UI
    overlay.style.zIndex = "2147483647";
    overlay.style.pointerEvents = "auto";
    overlay.style.borderRadius = "8px";
    overlay.style.padding = "10px";
    overlay.style.boxShadow = "0 0 20px rgba(0,0,0,0.6)";
    overlay.style.overflow = "hidden";

    document.body.appendChild(overlay); //add in the overlay

    //Force header color to white to see array size (use !important to override page styles)
    const header = overlay.querySelector('h3');
    header.style.setProperty('color', '#ffffff', 'important');

    // Style the close button :)
    const closeBtn = document.getElementById("closeOverlay");
    if (closeBtn) { //just check if exists for debug
        closeBtn.style.display = "block";
        closeBtn.style.width = "100%";
        closeBtn.style.marginTop = "8px";
        closeBtn.style.background = "#ffffff";
        closeBtn.style.color = "#000000";
        closeBtn.style.fontFamily = "'Lucida Console', Monaco, monospace";
        closeBtn.style.fontWeight = "700";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "6px";
        closeBtn.style.padding = "8px 10px";
        closeBtn.style.cursor = "pointer";
    }

    document.getElementById("closeOverlay").onclick = () => overlay.remove();//button to close overlay
}

