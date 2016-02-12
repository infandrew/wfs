!function() {

	// Create the event
	var SAAgentProvider, connectEvent = new CustomEvent("socketConnected"),
		dataReceivedEvent = new CustomEvent("dataReceived"), agentCallbackTimer;

	function tryCatchProxy(callback) {
		try {
			callback();
		} catch (err) {
			var errMsg = "exception [" + err.name + "] msg[" + err.message
					+ "]";
			console.log(errMsg);
		}
	}

	function onError(err) {
		var errMsg = "err [" + err + "]";
		console.log(errMsg);
	}

	function disconnect() {
		tryCatchProxy(function() {
			if (SASocket !== null) {
				SASocket.close();
				SASocket = null;
			}
		});
	}

	/**
	 * Declaration of listeners for SASocket
	 */
	var agentCallback = {

		/* Remote peer agent (Consumer) requests a service (Provider) connection */
		onrequest : function(peerAgent) {
			window.PeerAgent = peerAgent;
			SAAgentProvider.acceptServiceConnectionRequest(peerAgent);
		},

		onconnect : function(socket) {
			window.SASocket = socket;
			SASocket.setSocketStatusListener(function(reason) {
				disconnect();
			});

			SASocket.setDataReceiveListener(function(channelId, data) {
				var action = data;
				if (channelId === CHANNEL.ACTION)
					switch (action) {
					case ACTION.GET:
					case ACTION.NEW:
						window.startPicking = true;
						document.dispatchEvent(dataReceivedEvent);
						break;
					}
			});
			document.dispatchEvent(connectEvent);
		},
		onerror : onError
	};

	var peerAgentFindCallback = {
		onpeeragentfound : function(peerAgent) {
			
			// super hack
			/*agentCallbackTimer = setInterval(function(){
				if (!window.PeerAgent)
					tryCatchProxy(function() {
						SAAgentProvider.setServiceConnectionListener(agentCallback);
					});
				else
					clearInterval(agentCallbackTimer);
			}, 500);*/
			tryCatchProxy(function() {
				SAAgentProvider.setServiceConnectionListener(agentCallback);
			});			
		},
		onerror : onError
	}

	function requestSAAgentSuccess(agents) {
		var i;
		for (i = 0; i < agents.length; i++) {
			if (agents[i].role === "CONSUMER") {
				SAAgentProvider = agents[i];
				SAAgentProvider.setPeerAgentFindListener(peerAgentFindCallback);
				SAAgentProvider.findPeerAgents();
				return;
			}
		}
	}

	if (navigator.platform === "Linux i686") {
		window.startPicking = true;
	} else {
		window.startPicking = false;
		setTimeout(function(){
			webapis.sa.requestSAAgent(requestSAAgentSuccess);	
		}, 1000);		
	}
}();