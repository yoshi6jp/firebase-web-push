document.addEventListener('DOMContentLoaded', ()=> {
  document.getElementById('push').addEventListener('click', pushMsg , false);
})

function decodeBase64URL(str) {
  let dec = atob(str.replace(/\-/g, '+').replace(/_/g, '/'));
  let buffer = new Uint8Array(dec.length);
  for(let i = 0 ; i < dec.length ; i++)
    buffer[i] = dec.charCodeAt(i);
  return buffer;
}

function encodeBase64URL(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pushMsg(){
  navigator.serviceWorker.register('sw.js')
  .then(checkNotification)
  .then(getPublicKey)
  .then(getSubscription)
  .then(pushMessage)
}
function checkNotification(registration) {
  return new Promise( (resolve, reject)=> {
    Notification.requestPermission( permission => {
      if(permission !== 'denied'){
        resolve(registration);
      }else{
        reject();
      }
    })
  })
}

function getPublicKey(registration){
  return new Promise( resolve => {
    firebase.database().ref('/publicKey')
    .once('value', snapshot => {
      resolve({
        registration: registration, 
        publicKey: decodeBase64URL(snapshot.val())
      })
    })
  })
}

function getSubscription(params){
  return params.registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: params.publicKey
  })
}

function pushMessage(subscription){
  firebase.database().ref('/messages').push({
    message: document.getElementById('message').value,
    delay: document.getElementById('delay').value,
    options: {
      endpoint: subscription.endpoint,
      keys:{
        auth: encodeBase64URL(subscription.getKey('auth')),
        p256dh: encodeBase64URL( subscription.getKey('p256dh'))
      }
    }
  })
}

