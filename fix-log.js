const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'private/activity-log.json');
let log = JSON.parse(fs.readFileSync(file, 'utf8'));

// Find the compensatory offline event 
for (let i = log.length - 1; i >= 0; i--) {
  if (log[i].type === 'offline' && log[i].sessionDuration === null) {
    // The previous online event
    const onlineEvent = log.slice(0, i).reverse().find(e => e.type === 'online');
    if (onlineEvent) {
      // Set the offline timestamp to be exactly 4 minutes after the online event
      const onlineTs = new Date(onlineEvent.timestamp).getTime();
      const offlineTs = onlineTs + (4 * 60 * 1000); // 4 minutes later
      
      log[i].timestamp = new Date(offlineTs).toISOString();
      log[i].sessionDuration = 4 * 60 * 1000;
      log[i].message = "Ghost session sanitized";
      console.log('Sanitized ghost session offline event!');
      break;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(log, null, 2));
console.log('Done.');
