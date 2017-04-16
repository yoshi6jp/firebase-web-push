var functions = require('firebase-functions');
const webpush = require('web-push');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.createKey = functions.https.onRequest((req, res) => {
  const vapidKeys = webpush.generateVAPIDKeys();
  admin.database().ref('/publicKey').set(vapidKeys.publicKey);
  admin.database().ref('/privateKey').set(vapidKeys.privateKey);
  res.send("ok");
})
exports.pushMessage = functions.database.ref('/messages/{pushId}').onWrite(event => {
  const data = event.data.val();
  return Promise.all([
    admin.database().ref('/publicKey').once('value'),
    admin.database().ref('/privateKey').once('value'),
    new Promise( resolve => {
      setTimeout(resolve, (data.delay || 0) * 1000);
    })
  ])
  .then( s => {
    webpush.setVapidDetails(
      'mailto:example@yourdomain.org',
      s[0].val(),
      s[1].val()
    )
    webpush.sendNotification(data.options, data.message);
  })
})
