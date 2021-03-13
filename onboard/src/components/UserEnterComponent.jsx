import React, { Component } from 'react';
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