const config={
    userIdToSearch: "USER_ID_HERE", // You must be friends with the user in order for it to work.
    yourUserToken: "YOUR_TOKEN_HERE" // Your account token you are using to search for friends.
}

const discordSelfbot=require("discord.js-selfbot-v13");
const clientSelfbot=new discordSelfbot.Client;

function createFetchOptions(t,e,n){return{headers:{accept:"*/*","accept-language":"en-US,en;q=0.9",authorization:t,"content-type":"application/json"},body:e?JSON.stringify({settings:e}):null,method:n}}
function getGuilds(u){return u.guilds.cache.map(u=>u)}
function formatTime(o){let t=Math.floor(o/3600),r=Math.floor(o%3600/60);return t=t<10?"0"+t:t,r=r<10?"0"+r:r,`${t}:${r}:${o=(o%=60)<10?"0"+o:o}`}
function searchById(r,e){for(let n=0;n<r.length;n++)if(r[n].id===e)return r[n];return!1}

async function getGuildMembers(e){return await e.members.fetch(),e.members.cache.map(e=>e)}
async function fetchUserRelationships(e){let t=e.client,s=e.id,i=t.token;try{let t=await fetch("https://discord.com/api/v9/users/"+s+"/relationships",createFetchOptions(i,null,"GET")),a=await t.json();return"You are being rate limited."===a.message?new Promise(t=>{setTimeout(async()=>{t(await fetchUserRelationships(e))},1e3*a.retry_after)}):a}catch(e){console.error(e)}}

clientSelfbot.on("ready", async (bot) => {
    const botDisplayName = bot.user.displayName;
    console.log(`Logged in as ${botDisplayName}.`);
    let foundMemberList = "0";
    console.log(`Initialized: foundMemberList`);
    let checkedMemberList = new Set();
    console.log(`Initialized: checkedMemberList`);
    let allGuilds = await getGuilds(clientSelfbot);
    console.log(`Fetched: ${allGuilds.length} Guilds`);
    for (const guildSelected of allGuilds.values()) {
        const guildMembers = await getGuildMembers(guildSelected);
        console.log(`Fetched: ${guildMembers.length} Guild members`);
        let startTime = Date.now();
        let timeDifferences = [];
        let sumTimeDifferences = 0;
        let index = 0;
        let oldConsoleMessage = "";

        for (const guildMember of guildMembers.values()) {
            let currentTime = Date.now();
            let timeDifference = currentTime - startTime;
            timeDifferences.push(timeDifference);
            sumTimeDifferences += timeDifference;
            if (timeDifferences.length > 120) {
                let oldestTimeDifference = timeDifferences.shift();
                sumTimeDifferences -= oldestTimeDifference;
            }
            let averageTimeDifference = sumTimeDifferences / timeDifferences.length;
            let estimatedWaitTime = averageTimeDifference * (guildMembers.length - index);
            let formattedEstimatedWaitTime = formatTime(Math.floor(estimatedWaitTime/1000));
            let completionTime = new Date(Date.now() + estimatedWaitTime);
            let completionTimeString = completionTime.toLocaleTimeString();
            index++;
            let newConsoleMessage = `Searching guild: ${Math.floor((index/guildMembers.length)*100)}%. Completion time: ${completionTimeString}.`;
            if (oldConsoleMessage !== newConsoleMessage) {console.log(newConsoleMessage);}
            oldConsoleMessage = newConsoleMessage;
            startTime = currentTime;
            if (!checkedMemberList.has(guildMember.id)) {
                try {
                checkedMemberList.add(guildMember.id);
                const memberRelationships = await fetchUserRelationships(guildMember);
                if (searchById(memberRelationships, config.userIdToSearch)) {
                    console.log(`Found member: ${guildMember.id}`)
                    foundMemberList += `, ${guildMember.id}`;
                }
                } catch (error) {console.error(error)}
            }
        }
    }
    console.log(`Completed operation: ${foundMemberList}`);
});

clientSelfbot.login(config.yourUserToken);
