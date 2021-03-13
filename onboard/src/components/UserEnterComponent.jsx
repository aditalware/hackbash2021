import React, { Component } from 'react';
import Video from 'twilio-video';
import { Client as ConversationsClient } from "@twilio/conversations";
import '../css/style.css';
import Axios from 'axios';




let connected = false;
let room;
let chat;
let conv;
let screenTrack;

// let dict = {};

let dict = new Map();

let now_streaming="";

let mentor;
let participant= new Map();

let recent_message;

const GetRequestApi = async(url,data) => {
    let timeout =10000 ;
    let response ={
        data:{},
        err:null
    }
    try {
        let resp = await Axios.post(url,data, {headers: getHeaders(),timeout:timeout});
       
        if(resp.data ){
            return resp.data;
        }
    }catch(error) {
        let resp = error;
        // throw error ;
        response.err=resp;
        return response
    }
};

const PostRequestApi = async(url,img) => {
    let timeout =10000 ;
    let response ={
        data:{},
        err:null
    }
    try {
        let resp = await Axios.post(url,img, {headers: getHeaders(),timeout:100000});
       
        if(resp.data ){
            return resp.data;
        }
    }catch(error) {
        let resp = error;
        // throw error ;
        response.err=resp;
        return response
    }
};


const getHeaders =() =>{
    let headers =
        { 'Content-Type': 'application/x-www-form-urlencoded',
            
         } ;
    return headers ;
 
 }

// async function addLocalVideo() {

//     let trackElement = await document.getElementById('video');

//     Video.createLocalVideoTrack().then(track => {
//         const localMediaContainer = document.getElementById('video');
//         localMediaContainer.appendChild(track.attach());
//         // let video = document.getElementById('myVideo');
//         // let trackElement = track.attach();
//         // trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
//         // video.appendChild(trackElement);
//         // console.log(trackElement);
//         // trackElement.setAttribute("id", "video2");
//         // console.log(video);
//     });
// };


async function capture1() {
    var canvas = await document.getElementById('canvas');
    var video = await document.getElementById('video');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
    var img1 = canvas.toDataURL();
    
    // $.ajax({
    //             url: '/process1',
    //             data: {
    //                 imageBase64 : img1                    
    //             },
    //             type: 'POST',
    //             success: function(data){
    //                 // $("#result").text("Predicted Output : "+data);
    //                 // canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight); 
    //                 console.log("success!!")
    //                 // console.log(data)
    //                 conv.sendMessage(data);
    //             } 
    //         })


    let url="https://fb5de64b845c.ngrok.io/process_image";
    let dataTosend=JSON.stringify({img:img1});
    PostRequestApi(url,dataTosend).then(data => {
        console.log(data);
        conv.sendMessage(data.ans);
        
    }).catch(e => {
        console.log(e);
        
    });

    // conv.sendMessage("https://i.pinimg.com/originals/83/f9/37/83f937b69f30bb886ab8a03390da6771.jpg");
};

async function assignMentor(event){
    const usernameInput =await document.getElementById('username');
    mentor = usernameInput.value;
    now_streaming = mentor;
    connectButtonHandler(event);
    
    // console.log(mentor);
    // Disable Mentor Button
    // document.getElementById('join_leave_mentor').style.display = "none";
    // document.getElementById('Turn').style.display = "none";
    
}
async function assignStudent(event){
    const usernameInput =await document.getElementById('username');
    console.log(usernameInput.value);
    connectButtonHandler(event);
    
    // console.log(mentor);
    // Disable Mentor Button
    // document.getElementById('join_leave_mentor').style.display = "none";
    // document.getElementById('Turn').style.display = "none";
    
}




async function connectButtonHandler(event) {
    // event.preventDefault();
    // const button = await document.getElementById('join_leave_student');
    const lableInput =await document.getElementById('one');
    const shareScreen = await document.getElementById('share_screen');
    const usernameInput = await document.getElementById('username');

    if (!connected) {
        let username = usernameInput.value;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        // button.disabled = true;
        // button.innerHTML = 'Connecting...';
        if(String(username)!=="undefined" && !participant[username]){
            participant[username]=true;

        connect(username).then(() => {
            lableInput.innerHTML = username;
            // button.innerHTML = 'Leave call';
            // button.disabled = false;
            shareScreen.disabled = false;
            // capture.disabled = false;
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
            // button.innerHTML = 'Join call';
            // button.disabled = false;
        });}
    }
    else {
        disconnect();
        // button.innerHTML = 'Join call';
        connected = false;
        shareScreen.innerHTML = 'Share screen';
        shareScreen.disabled = true;
        // capture.disabled = true;
    }
};

async function connect(username) {
    let url="https://fb5de64b845c.ngrok.io/login";
   
    const usernameInput =await document.getElementById('username');
    const localDiv =await document.getElementById('local');

    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        let data={username:usernameInput.value};
         GetRequestApi(url,data).then(_data => {
            // join video call
            data = _data;
            return Video.connect(String(data.token));
        }).then(_room => {
            room = _room;
            if(username != now_streaming){
                localDiv.className = "participantHidden";
            }
            if(username == now_streaming){
                localDiv.className = "participant";
            }
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();
            devicesDisplay();
            connectChat(data.token, data.conversation_sid);
            resolve();
        }).catch(e => {
            console.log(e);
            reject();
        });
    });
    return promise;
};


async function attachTracks(tracks) {
    const container =await document.getElementById('myVideo');

  tracks.forEach(function(track) {
    if (track) {
          let d = document.getElementById("myVideo");
      console.log(d.childNodes);
      try{
        d.removeChild(d.childNodes[0]);
      }catch(e){
         console.log(e);
      }
      let v = track.attach();
      v.setAttribute('id','video');
      console.log(v);
      container.appendChild(v);
    
    }
  });
  // console.log("Hrll");
   
}

function detachTracks(tracks) {
  tracks.forEach(function(track) {
    if (track) {
      track.detach().forEach(function(detachedElement) {
        detachedElement.remove();
      });
    }
  });
}


function stopTracks(tracks) {
  tracks.forEach(function(track) {
    if (track) { track.stop(); }
  })
}



async function devicesDisplay(){
  navigator.mediaDevices.enumerateDevices().then(gotDevices);
  const select = await document.getElementById('video-devices');
  select.addEventListener('change', updateVideoDevice);

}

async function gotDevices(mediaDevices) {
  console.log("KK");
  const select = await document.getElementById('video-devices');
//   select.innerHTML = `<option value="0">
//                Select Camera
//                 </option>`;
  
  let count = 0;
  mediaDevices.forEach(mediaDevice => {
    if (mediaDevice.kind === 'videoinput') {
      const option = document.createElement('option');
      option.value = mediaDevice.deviceId;
      const label = mediaDevice.label || `Camera ${count++}`;
      const textNode = document.createTextNode(label);
      option.appendChild(textNode);
      select.appendChild(option);
    }
  });
}


function updateVideoDevice(event) {
  const select = event.target;
  const localParticipant = room.localParticipant;
  if (select.value !== '') {
    const tracks = Array.from(localParticipant.videoTracks.values()).map(
      function(trackPublication) {
        return trackPublication.track;
      }
    );
    localParticipant.unpublishTracks(tracks);
    console.log(localParticipant.identity + ' removed track: ' + tracks[0].kind);

    detachTracks(tracks);
    stopTracks(tracks);
    Video.createLocalVideoTrack({
      deviceId: { exact: select.value }
    }).then(function(localVideoTrack) {
      localParticipant.publishTrack(localVideoTrack);
      console.log(localParticipant.identity + ' added track: ' + localVideoTrack.kind);
      const previewContainer = document.getElementById('myVideo');
      attachTracks([localVideoTrack], previewContainer);
    });
  }
}



async function updateParticipantCount() {
    const count = await document.getElementById('count');

    
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};



async function participantConnected(participant) {
    const container =await document.getElementById('container');

    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    
if(participant.identity == now_streaming){
    participantDiv.setAttribute('class','participant');
}
else {
    participantDiv.setAttribute('class','participantHidden');   
}
    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.setAttribute('class', 'label');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    dict[participant.identity] = participant.sid;

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

async function participantDisconnected(participant) {
  let a= await document.getElementById(participant.sid);
  a.remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    let trackElement = track.attach();
    trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
    div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => {
        if (element.classList.contains('participantZoomed')) {
            zoomTrack(element);
        }
        element.remove()
    });
};

async function disconnect() {
    const toggleChat =await document.getElementById('toggle_chat');
    const root = await document.getElementById('root');
    const container =await document.getElementById('container');

    room.disconnect();
    if (chat) {
        chat.shutdown().then(() => {
            conv = null;
            chat = null;
        });
    }
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    // button.innerHTML = 'Join call';
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    toggleChat.disabled = true;
    connected = false;
    updateParticipantCount();
};

async function shareScreenHandler() {
    // event.preventDefault();
    const shareScreen = await document.getElementById('share_screen');

    if (!screenTrack) {
        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };
            console.log(screenTrack);
            shareScreen.innerHTML = 'Stop sharing';
        }).catch(() => {
            alert('Could not share the screen.')
        });
    }
    else {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        shareScreen.innerHTML = 'Share screen';
    }
};

async function zoomTrack(trackElement) {
    const container =await document.getElementById('container');



    if (!trackElement.classList.contains('trackZoomed')) {
        // zoom in
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                let zoomed = false;
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('trackZoomed')
                        zoomed = true;
                    }
                });
                if (zoomed) {
                    participant.classList.add('participantZoomed');
                }
                else {
                    participant.classList.add('participantHidden');
                }
            }
        });
    }
    else {
        // zoom out
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('trackZoomed');
                    }
                });
                participant.classList.remove('participantZoomed')
                participant.classList.remove('participantHidden')
            }
        });
    }
};

 async function connectChat(token, conversationSid) {
    const chatContent =await document.getElementById('chat-content');
    const toggleChat = await document.getElementById('toggle_chat');
    const usernameInput = await document.getElementById('username');
    return ConversationsClient.create(token).then(_chat => {//change
        chat = _chat;
        return chat.getConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            conv.on('messageAdded', async(message) => {
                const val = await parseURL(message.author, message.body);
                if(val == 0)
                    addMessageToChat(message.author, message.body);
            });
            return conv.getMessages().then((messages) => {
                chatContent.innerHTML = '';
                console.log(messages.items.map((m)=>m.body));
                if(usernameInput.value == mentor){
                    conv.sendMessage('Mentor joined '+mentor);
                    
                }
                // alert("Let See");
                // for (let i = 0; i < messages.items.length; i++) {
                //     addMessageToChat(messages.items[i].author, messages.items[i].body);
                // }
                toggleChat.disabled = false;
            });
        });
    }).catch(e => {
        console.log(e);
    });
};

async function addMessageToChat(user, message) {
    const chatContent = await document.getElementById('chat-content');
    const chatScroll = await document.getElementById('chat-scroll');


    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

async function toggleChatHandler() {
    const chatScroll = await document.getElementById('chat-scroll');
    const root = await document.getElementById('root');

    // event.preventDefault();
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    else {
        root.classList.add('withChat');
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
};

async function onChatInputKey(ev) {
    console.log('chat');
    // console.log(ev);

    const chatInput = await document.getElementById('chat-input');
    // console.log(chatInput.value);
    const usernameInput = await document.getElementById('username');


    if (ev.keyCode == 13) {//enter
        console.log('enter pressed')
        // console.log(conv);
        // console.log(conv.sendMessage(chatInput.value));
        conv.sendMessage(chatInput.value);
        // conv.emit('messageAdded',{author:usernameInput.value,body:chatInput.value});
        chatInput.value = '';
    }
};


// document.getElementById("Turn").onClick = function() {
//     conv.sendMessage("accept " + usernameInput.value);
// }

// document.getElementById("Allow").onClick = function() {
//     if(mentor == usernameInput.value){
//         conv.sendMessage("Access Allowed to "+recent_message);
//     }
// }

// document.getElementById("turn_over").onClick = function() {
//     conv.sendMessage("Access Granted to "+mentor);
// }

// document.getElementById("cls").onClick = function() {
//     conv.sendMessage("clear screen");
//     images.innerHTML = "";
// }

async function parseURL(author, message) {
    const images = await document.getElementById('imageDiv');

    if(message.startsWith("https")){
        // document.getElementById("myImg").src = message;

        let image = document.createElement('img');

        image.setAttribute('class','myImg');

        image.setAttribute('src',message);

        images.appendChild(image);

        return 1;

    }
    else if(message.startsWith("accept")){

        recent_message = author;
    
    }
    else if(message.startsWith("Access Granted ")== true && author == mentor){
        var now_id = dict[now_streaming];
        var want_id = dict[author];
        
        if(now_id==undefined){
            now_id = "local";
        }
        if(want_id == undefined){
            want_id = "local";
        }

        console.log(now_id);
        console.log(want_id);

        if(now_id != want_id){
            document.getElementById(now_id).setAttribute('class','participantHidden');
            document.getElementById(want_id).setAttribute('class','participant');
        }
        now_streaming = author;
    }

    else if(message.startsWith("Access Allowed") == true && author == mentor){
        
        var now_id = dict[now_streaming];
        var want_id = dict[recent_message];
        
        if(now_id==undefined){
            now_id = "local";
        }
        if(want_id == undefined){
            want_id = "local";
        }

        console.log(now_id);
        console.log(want_id);

        if(now_id != want_id){
            document.getElementById(now_id).setAttribute('class','participantHidden');
            document.getElementById(want_id).setAttribute('class','participant');
        }
        now_streaming = recent_message;

    }
    else if(message.startsWith("Mentor joined") == true){
        var want_id = dict[author];
        if(want_id == undefined){
            want_id = "local";
        }
        document.getElementById(want_id).setAttribute('class','participant');

        now_streaming = author;
        mentor = author;
    }
    else if(message.startsWith("clear screen") == true && author == mentor){
        images.innerHTML = "";
    }

    return 0;
}

function JoinedAs() {
    document.getElementById("container").style.display = "block";
    // document.getElementById("somebuttons").style.display = "inline-flex";
    // document.getElementById("panel").style.display = "none";
    // document.getElementById("panel").style.textAlign = "center";
    // document.getElementById("somemorebtns").style.display = "block";
    // document.getElementById("cameraop").style.display = "inline-flex";
    document.getElementById("turn_over").style.display = "block";
    document.getElementById("room").style.display = "none";
    document.getElementById("name").style.display = "none";
    document.getElementById("room_input").style.display = "none";
    document.getElementById("name_input").style.display = "none";

}

function onStart() {
    if (
        !"mediaDevices" in navigator ||
        !"getUserMedia" in navigator.mediaDevices
    ) {
        alert("Camera API is not available in your browser");
        return;
    }

    // get page elements
    const video = document.querySelector("#video");

    // video constraints
    const constraints = {
        video: {
            width: {
                min: 1280,
                ideal: 1920,
                max: 2560,
            },
            height: {
                min: 720,
                ideal: 1080,
                max: 1440,
            },
        },
    };

    // use front face camera
    let useFrontCamera = true;

    // current video stream
    let videoStream;

    // handle events
    // play
    ////////////////
    // btnChangeCamera.addEventListener("click", function() {
    //     useFrontCamera = !useFrontCamera;

    //     initializeCamera();
    // });

    // stop video stream
 
    // initialize
    async function initializeCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach((track) => {
                track.stop();
            });
        }
        constraints.video.facingMode = useFrontCamera ? "user" : "environment";

        try {
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = videoStream;
        } catch (err) {}
    }

    initializeCamera();
}


function Student(){
    return(<div>

    </div>);
}
function Mentor(){
    return(<div>

    </div>);
}

class UserEnterComponent extends Component {

    constructor(props){
        super(props);
        this.state={
            name:"",
            code:"",
            
        }
        this.handleSubmit=this.handleSubmit.bind(this);
      
    }

    async componentDidMount (){
       onStart();
    
    }

    
 
    handleSubmit(event){
     event.preventDefault();
     connect({username:this.state.name,setlocalPartipantDiv:this.setlocalPartipantDiv,setCount:this.setCount});
    }


    render() {

        // if(!this.state.student && !this.state.mentor)
        return (
            <div>
               <div className="maindiv" >
                                            <div className="style1">
                                            </div>
                                            <div className="head titlefor">
                                                <h1 className="headingfor">OnBoard</h1>
                                            </div>
                                        <form className="formstyle formfor" onSubmit={this.handleSubmit}>
                                                    <div id="name" className="namefield">
                                                        <label for="username" className="style2">Enter Name</label>
                                                    </div>
            {/* <!-- <video autoplay playsinline id="video"></video> --> */}
                                                    <div id="name_input" className="nameinput">
                                                        <i className="fas fa-user" className="style3"></i> 

                                                        <input type="text" autocomplete="off"  className="inputfield" name="username" id="username" onChange={(e)=>this.setState({name:e.target.value})}/>


                                                    </div>
                                                        <div id="room" className="roomcode">
                                                            <label for="code" className="style2">Enter Room Code</label>
                                                        </div>
                                                        </form>
                                                   
      </div>
    </div>
            
        )
       
    }
}

export default  UserEnterComponent;