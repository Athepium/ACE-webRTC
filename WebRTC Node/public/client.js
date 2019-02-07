var divSelectRoom = document.getElementById("selectRoom")
var divConsultingRoom = document.getElementById("ConsultingRoom")
var inputRoomNumber = document.getElementById("roomNumber")
var btnGoRoom = document.getElementById("goRoom")
var localVideo = document.getElementById("localVideo")
var remoteVideo = document.getElementById("remoteVideo")

var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
var iceServers = {
  'iceServers':[
    {'url':'stun:stun.I.google.com:19302'}
  ]
}
var StreamConstraints = { audio:true, video:true};
var isCaller;

var socket = io();

btnGoRoom.onclick = function (){
  if(inputRoomNumber.value==="") {
    alert("Veuillez entrer un code valide")
  } else{
    roomNumber = inputRoomNumber.value;
    socket.emit('create or join',roomNumber);
    divSelectRoom.style = "display:block;";

    socket.on('create', function (room){
      navigator.mediaDevices.getUserMedia(StreamConstraints).then(function (stream){
        localStream = stream;
        localVideo.src = URL.createObjectsURL(stream);
        isCaller = true;
      }).catch(function (err){
        console.log('Une erreur est survenue, votre webcam est peut-être déconnectée');
      });
    });

    socket.on('connected',function (room){
      navigator.mediaDevices.getUserMedia(StreamConstraints).then(function (stream){
        localStream = stream;
        localVideo.src = createObjectsURL(stream);
        socket.emit('ready',roomNumber);
      }).catch(function (err){
        console.log('Une erreur est survenue, votre webcam est peut-être déconnectée');
      });
    });

    socket.on('ready',function(){
      if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.onicecandidate = oniceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);

        rtcPeerConnection.createOffer(setLocalAndOffer, function(e){console.log(e)});
      }
    });

    socket.on('offer',function (event){
      if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        rtcPeerConnection.oneiceCandidate = oniceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        rtcPeerConnection.addStream(localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));

        rtcPeerConnection.createAnswer(setLocalAndAnswer, function(e){console.log(e)});
      }
    });

    socket.on('answer', function (event){
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    });

    socket.on('candidate', function(event){
      varCandidate = new RTCIceCandidate({
        sdpMLineIndex: eventlabel,
        candidate: event.candidate
      });
      rtcPeerConnection.addIceCandidate(candidate);
    });

    function onAddStream(event) {
      remoteVideo.src =createObjectsURL(event.stream);
      remoteStream = event.stream;
    }

    function oniceCandidate(event){
      if(event.candidate){
        console.log('sending ice candidate');
        socket.emit('candidate',{
          type:'candidate',
          label:event.candidate.sdpMLineIndex,
          id:event.candidate.sdpMid,
          candidate:event.candidate.candidate,
          room:roomNumber
        })
      }
    }

    function setLocalAndOffer(sessionDescription){
      rtcPeerConnection.setLocalDescription(sessionDescription);
      socket.emit('answer',{
        type:'answer',
        sdp: sessionDescription,
        room: roomNumber
      });
    }
  }
}
