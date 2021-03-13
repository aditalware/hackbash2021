import React, { Component } from 'react';
import '../css/style.css';
import Axios from 'axios';
import Video from 'twilio-video';

let connected = false;
let room;
let chat;
let conv;
let screenTrack;

// let dict = {};

let dict = new Map();

let now_streaming="";

let mentor;

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


const getHeaders =() =>{
    let headers =
        { 'Content-Type': 'application/x-www-form-urlencoded',
            
         } ;
    return headers ;
 
 }

async function addLocalVideo() {

    let trackElement = await document.getElementById('video');

    Video.createLocalVideoTrack().then(track => {
 
        trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
     
    });
};


async function assignMentor(event){
    const usernameInput =await document.getElementById('username');
    connectButtonHandler(event);
    let mentor = usernameInput.value;
    console.log(mentor);

    now_streaming = mentor;
    
}

function assignStudent(event){

}


async function connect(username) {
    let url="https://60c6eeef357e.ngrok.io/login";
   
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
    const container =await document.getElementById('container');

  tracks.forEach(function(track) {
    if (track) {
      let v = track.attach();
      v.setAttribute('id','video');
      console.log(v);
      container.appendChild(v);
      let d = document.getElementById("myVideo");
      console.log(d.childNodes);
      d.removeChild(d.childNodes[1]);
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
  
  let count = 1;
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
    participantDiv.setAttribute('className',!String(participant.identity).localeCompare(now_streaming)?'participant':'participantHidden');
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

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
};



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