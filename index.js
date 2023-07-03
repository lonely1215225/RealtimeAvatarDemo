// 定义服务器地址，你可能需要根据实际情况进行修改
const apiKey = 'YourApiKey';


const SERVER_URL = 'https://api.dev.heygen.com';
let sessionInfo = null;
let peerConnection = null;

const statusElement = document.querySelector('#status');
statusElement.innerHTML += 'Please click the new button to create the stream first.<br>';
statusElement.scrollTop = statusElement.scrollHeight;
// Create a new WebRTC session when clicking the "New" button
async function createNewSession() {
  console.log("Creating new session...");
  statusElement.innerHTML += 'Creating new session... please wait<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
  // Creating RTCPeerConnection instance
  peerConnection = new RTCPeerConnection({ iceServers: [] });


  // Creating new WebRTC session
  peerConnection.onicecandidate = ({ candidate }) => {
    console.log('Adding the candidate')
    if (candidate) {
      handleICE(sessionInfo.session_id, candidate.toJSON());
    }
  };  
  sessionInfo = await newSession('high');
  console.log(sessionInfo );
  const { sdp: serverSdp, ice_servers: iceServers } = sessionInfo;

  let formattedIceServers = iceServers.map(server => ({ urls: server }));
  peerConnection.setConfiguration({ iceServers: formattedIceServers });
// When ICE candidate is available, send to the server
  peerConnection.oniceconnectionstatechange = event => {
    peerConnection.oniceconnectionstatechange = event => {
      console.log('ICE connection state change:', peerConnection.iceConnectionState);
      statusElement.innerHTML += `ICE connection state changed to: ${peerConnection.iceConnectionState}<br>`;
      statusElement.scrollTop = statusElement.scrollHeight;
      if (peerConnection.iceConnectionState === 'failed' || 
          peerConnection.iceConnectionState === 'disconnected') {
        statusElement.innerHTML += `Connection lost. Please reconnect or refresh the page.<br>`;
        statusElement.scrollTop = statusElement.scrollHeight;
      }
    };
    
  };

  console.log("Starting new session...");

   

  // When audio and video streams are received, display them in the video element
  const mediaElement = document.querySelector('#mediaElement');
  peerConnection.ontrack = (event) => {
    console.log('Received the track')
    if (event.track.kind === 'audio' || event.track.kind === 'video') {
      mediaElement.srcObject = event.streams[0];
    }
  };    

  // Set server's SDP as remote description
  const remoteDescription = new RTCSessionDescription(serverSdp);
  await peerConnection.setRemoteDescription(remoteDescription);
  statusElement.innerHTML += 'Session creation completed<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
  statusElement.innerHTML += 'Now.You can click the start button to start the stream<br>';
  statusElement.scrollTop = statusElement.scrollHeight;

  const startBtn = document.querySelector('#startBtn');
  const sendTaskBtn = document.querySelector('#sendTaskBtn');
  const closeBtn = document.querySelector('#closeBtn');
  startBtn.disabled = false;
  sendTaskBtn.disabled = false;
  closeBtn.disabled = false;
}

// Start session and display audio and video when clicking the "Start" button
async function startAndDisplaySession() {
  if (!sessionInfo) {
    statusElement.innerHTML += 'Please create a connection first<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    return;
  }

  statusElement.innerHTML += 'Starting...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;

  // Create and set local SDP description
  const localDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(localDescription);

  // Start session
  await startSession(sessionInfo.session_id, localDescription);
  statusElement.innerHTML += 'Session started successfully...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
}

const taskInput = document.querySelector('#taskInput');
const sendTaskBtn = document.querySelector('#sendTaskBtn');
const closeBtn = document.querySelector('#closeBtn');

 
// When clicking the "Send Task" button, get the content from the input field, then send the task
sendTaskBtn.addEventListener('click', async () => {
  if (!sessionInfo) {
    statusElement.innerHTML += 'Please create a connection first<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    return;
  }
  statusElement.innerHTML += 'Sending task...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
  const text = taskInput.value;
  if (text.trim() === '') {
    alert('Please enter a task');
    return;
  }

  const resp = await sendTask(sessionInfo.session_id, text);

  statusElement.innerHTML += 'Task sent successfully...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
});

// When clicking the "Close Connection" button, close the local connection and call the close interface
closeBtn.addEventListener('click', async () => {
  if (!sessionInfo) {
    statusElement.innerHTML += 'Please create a connection first<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    return;
  }
  statusElement.innerHTML += 'Closing...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
  try {
    // Close local connection
    peerConnection.close();
    // Call the close interface
    const resp = await stopSession(sessionInfo.session_id);

    console.log(resp);
  } catch (err) {
    console.error('Failed to close the connection:', err);
  } 
  statusElement.innerHTML += 'Closing completed...<br>';
  statusElement.scrollTop = statusElement.scrollHeight;
}); 




// 为按钮添加点击事件处理函数
document.querySelector('#newBtn').addEventListener('click', createNewSession);
document.querySelector('#startBtn').addEventListener('click', startAndDisplaySession);



// 新建一个 WebRTC 会话
async function newSession(quality) {
  const response = await fetch(`${SERVER_URL}/v1/realtime.new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({ quality , username:usrname }),
  });
  if (response.status === 500) {
    console.error('Server error');
    statusElement.innerHTML += 'Server Error. Please ask the staff if the service has been turned on<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    throw new Error('Server error');
  }else{
    const data = await response.json();
    console.log(data.data)
    return data.data;
  }

}

// 开始一个 WebRTC 会话
async function startSession(session_id, sdp) {
  const response = await fetch(`${SERVER_URL}/v1/realtime.start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({ session_id, sdp , username:usrname}),
  });
  if (response.status === 500) {
    console.error('Server error');
    statusElement.innerHTML += 'Server Error. Please ask the staff if the service has been turned on<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    throw new Error('Server error');
  }else{
    const data = await response.json();
    return data.data;
  }

}

// 处理 ICE candidate
async function handleICE(session_id, candidate) {
  const response = await fetch(`${SERVER_URL}/v1/realtime.ice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({ session_id, candidate, username:usrname }),
  });
  if (response.status === 500) {
    console.error('Server error');
    statusElement.innerHTML += 'Server Error. Please ask the staff if the service has been turned on<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    throw new Error('Server error');
  }else{
    const data = await response.json();
    return data;
  }

}

// 发送任务
async function sendTask(session_id , text) {
  const response = await fetch(`${SERVER_URL}/v1/realtime.task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({ session_id, text, username:usrname }),
  });
  if (response.status === 500) {
    console.error('Server error');
    statusElement.innerHTML += 'Server Error. Please ask the staff if the service has been turned on<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    throw new Error('Server error');
  }else{
    const data = await response.json();
    return data.data;
  }

}


// 停止会话
async function stopSession(session_id) {
  const response = await fetch(`${SERVER_URL}/v1/realtime.stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey
    },
    body: JSON.stringify({ session_id , username:usrname}),
  });
  if (response.status === 500) {
    console.error('Server error');
    statusElement.innerHTML += 'Server Error. Please ask the staff if the service has been turned on<br>';
    statusElement.scrollTop = statusElement.scrollHeight;
    throw new Error('Server error');
  } else{
    const data = await response.json();
    return data.data;
  }

}
