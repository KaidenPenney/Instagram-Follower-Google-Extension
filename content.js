console.log("if you see this script properly injected big words ik");
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
        showOverlay(msg.users);
        //no send response needed so no return true needed
    }

})

//chat gpt preaching about how to do an overlay
function showOverlay(users) {
  const old = document.getElementById("insta-overlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "insta-overlay";

  overlay.innerHTML = `
    <h3>Not Following Back (${users.length})</h3>
    <button id="closeOverlay">Close</button>
    <div class="list">
      ${users.map(u => `<div class="user">${u}</div>`).join("")}
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("closeOverlay").onclick = () => overlay.remove();
}

