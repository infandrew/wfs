/*global tau */
(function() {
	var SAAgentProvider,
		SASocket = null, 
		appName = "PhoneSafe",
		isCircle = tau.support.shape.circle,
		codeSingleValue = 0,
		pressTimer,
		longPress = false,
		picking = false,
		
		CHANNEL = {
			ACTION: 228
		},
		ACTION = {
			CLOSE: "close",
			OPEN: "open"
		},
	
		connectStatus = document.getElementById("connect_status"),
		actionStatus = document.getElementById("action_status"),
		actionButton = document.getElementById("action_button"),
		lockDiv = document.getElementById("lock"),
		codeDiv = document.getElementById("code"),
		currentValueDiv = document.getElementById("current_value"),
		fullValueDiv = document.getElementById("full_value");

	function updateConnectStatus(text) {
		connectStatus.innerHTML = text;
	}
	function updateActionStatus(text) {
		actionStatus.innerHTML = text;
	}
	function updateFullValue(text) {
		if (text === "" || fullValueDiv.innerHTML === "")
			fullValueDiv.innerHTML = text;
		else
			fullValueDiv.innerHTML += "." + text;
			
	}	
	function updateSingleValue() {
		currentValueDiv.innerHTML = codeSingleValue;
	}	

	function tryCatchProxy(callback) {
		try {
			callback();
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
	}
	
	function onError(err) {
		console.log("err [" + err + "]");
	}

	function disconnect() {
		tryCatchProxy(function () {
			if (SASocket !== null) {
				SASocket.close();
				SASocket = null;
				updateConnectStatus('<span class="red-text">Disconnected<span>');
			}
		});
	}
	
	/**
	 * Declaration of listeners for SASocket
	 */
	var agentCallback = {
			
	    /* Remote peer agent (Consumer) requests a service (Provider) connection */
	    onrequest: function (peerAgent) {
	        /* Check connecting peer by appName*/
	        if (peerAgent.appName === appName) {
	        	SAAgentProvider.acceptServiceConnectionRequest(peerAgent);
	        	updateConnectStatus('<span class="green-text">Accept<span>');
	        } else {
	        	SAAgentProvider.rejectServiceConnectionRequest(peerAgent);
	        	updateConnectStatus('<span class="red-text">Reject<span>');
	        }
	    },			
			
		onconnect : function(socket) {
			SASocket = socket;
			updateConnectStatus('<span class="green-text">Connected<span>');
			SASocket.setSocketStatusListener(function(reason){
				console.log("Service connection lost, Reason : [" + reason + "]");
				disconnect();
			});
			SASocket.setDataReceiveListener(function (channelId, data) {
				var action = data;
				if (channelId === CHANNEL.ACTION)
					switch (action) {
						case ACTION.CLOSE:
						case ACTION.OPEN:
							startPicking();
							break;
					}
			});
		},
		onerror : onError
	};

	var peerAgentFindCallback = {
		onpeeragentfound : function(peerAgent) {
			tryCatchProxy(function () {
				if (peerAgent.appName === appName) {
					updateConnectStatus("Phone found");
					SAAgentProvider.setServiceConnectionListener(agentCallback);
					//SAAgentProvider.requestServiceConnection(peerAgent);
				} else {
					updateConnectStatus("Phone not found");
				}
			});
		},
		onerror : onError
	}

	function initSAAgent() {
		function requestSAAgentSuccess(agents) {
			var i;
			for (i = 0; i < agents.length; i++) {
				if (agents[i].role === "PROVIDER") {
					SAAgentProvider = agents[i];
					SAAgentProvider
							.setPeerAgentFindListener(peerAgentFindCallback);
					SAAgentProvider.findPeerAgents();
					return;
				}
			}
		}

		function requestSAAgentError(e) {
			updateConnectStatus("requestSAAgentError");
		}

		console.log(navigator.platform);
		if (navigator.platform === "Linux i686")
			updateConnectStatus("Emulator")
		else
			webapis.sa.requestSAAgent(requestSAAgentSuccess, requestSAAgentError);
	}

	/*function onActionButtonClick() {
		updateActionStatus("synchronization...");
		tryCatchProxy(function () {
			SASocket.sendData(666, "key1");
			SASocket.sendData(228, "key2");
		});
	}*/
	
	function rotaryDetentHandler() {
		// Get rotary direction
		var direction = event.detail.direction;

		if (direction === "CCW") {
			// Left direction
			codeSingleValue++;
		} else {
			// Right direction
			/*if (direction === "CW")*/
			codeSingleValue--;
		}
		if (codeSingleValue >= 100)
			codeSingleValue = 0;
		else if (codeSingleValue < 0)
			codeSingleValue = 99;
		
		lockDiv.style.webkitTransform = "rotate(-" + codeSingleValue/100.0*360 + "deg)";
		
		updateSingleValue()
	}
	
	function startPicking() {
		updateFullValue("");
		updateActionStatus("LongTap to finish<br>Tap to pick");
		picking = true;
	}

	function stopPicking() {
		updateFullValue("");
		updateActionStatus("Choose action in phone");
		picking = false;
		SASocket.sendData(CHANNEL.ACTION, fullValueDiv.innerHTML);
	}	
	
	function onCodeDivTouchStart() {
		// register long tap
		pressTimer = window.setTimeout(function() { longPress = true; },1000)		
	}
	
	function onCodeDivTouchEnd() {
		if (picking) {
			if (longPress) {
				console.log("long tap");
				stopPicking();
			} else {
				console.log("short tap");
				updateFullValue(codeSingleValue);
			}
		}
		longPress = false;
		clearTimeout(pressTimer);
	}
	
    /**
     * Registers view event listeners.
     */
    function bindEvents() {
    	codeDiv.addEventListener('touchstart', onCodeDivTouchStart);
    	codeDiv.addEventListener('touchend', onCodeDivTouchEnd);
        document.addEventListener("rotarydetent", rotaryDetentHandler);
    }	
	
    bindEvents();
	initSAAgent();
})();

window.onload = function() {
	/**
	 * Close app on back
	 */
	document.addEventListener('tizenhwkey', function(e) {
		if (e.keyName === "back") {
			try {
				tizen.application.getCurrentApplication().exit();
			} catch (ignore) {
			}
		}
	});
};
