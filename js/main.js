(function() {
	var SAAgentConsumer, SASocket = null, CHANNELID = 666, ProviderAppName = "PhoneSafe";

	var connectStatus = document.getElementById("connect_status");
	var safeStatus = document.getElementById("safe_status");
	var actionButton = document.getElementById("action_button");

	function updateConnectStatus(text) {
		connect_status.innerHTML = text;
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
			if (SASocket != null) {
				SASocket.close();
				SASocket = null;
				updateConnectStatus('<span class="red-text">Disconnected<span>');
			}
		});
	}
	
	var agentCallback = {
		onconnect : function(socket) {
			SASocket = socket;
			updateConnectStatus('<span class="green-text">Connected<span>');
			SASocket.setSocketStatusListener(function(reason){
				console.log("Service connection lost, Reason : [" + reason + "]");
				disconnect();
			});
			SASocket.setDataReceiveListener(onreceive);
		},
		onerror : onError
	};	
	
	var peerAgentFindCallback = {
		onpeeragentfound : function(peerAgent) {
			tryCatchProxy(function () {
				if (peerAgent.appName === ProviderAppName) {
					updateConnectStatus("PeerAgent found");
					SAAgentConsumer.setServiceConnectionListener(agentCallback);
					SAAgentConsumer.requestServiceConnection(peerAgent);
				} else {
					updateConnectStatus("PeerAgent not found");
				}
			});
		},
		onerror : onError
	}

	function initSAAgent() {
		function requestSAAgentSuccess(agents) {
			var i;
			for (i = 0; i < agents.length; i++) {
				if (agents[i].role === "CONSUMER") {
					updateConnectStatus("CONSUMER found");
					SAAgentConsumer = agents[i];
					SAAgentConsumer
							.setPeerAgentFindListener(peerAgentFindCallback);
					SAAgentConsumer.findPeerAgents();
					return;
				}
			}
			updateConnectStatus("SAAgent not found");
		}

		function requestSAAgentError(e) {
			updateConnectStatus("requestSAAgentError");
		}

		webapis.sa.requestSAAgent(requestSAAgentSuccess, requestSAAgentError);
	}

	function onActionButtonClick() {
		tryCatchProxy(function () {
			SASocket.sendData(CHANNELID, "KEY2281488");
		});
	}
	
    /**
     * Registers view event listeners.
     */
    function bindEvents() {
        actionButton.addEventListener('click', onActionButtonClick);
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
