var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server),
	db = require('./lib/db.js');

db.setup();

app.get('/', function(req, res) {
	res.sendfile('index.html');
});
app.get('/lib/angular.min.js', function(req, res) {
	res.sendfile('lib/angular.min.js');
});

io.on('connection', function(socket) {
	socket.emit('user-id', socket.id);

	var oldMsgBox = [];

	var dirtyCheck = function(){

		return db.getAllMessage(20, function(error, msgBox){
			if(error){

			} else {
				if (oldMsgBox !== msgBox){
					socket.emit('all-message', msgBox);
					oldMsgBox = msgBox;
				}				
			}
		})
	};
	dirtyCheck();

	// function timeout() {
	//     setTimeout(function () {
	//         // Do Something Here
	//         // Then recall the parent function to
	//         // create a recursive loop.
	//         dirtyCheck();
	//         timeout();
	//     }, 100);
	// }
	// timeout();

	socket.on('disconnect', function() {
		console.log(socket.id,'disconnected');
	});

	socket.on('user-send-msg', function(msg){
		console.log('client receive msg: ',msg);
		msg.timestamp = new Date().getTime();
		db.saveMessage(msg,function(error,saved){
			if(error || !saved){
				socket.emit('fail-to-save',msg);
			} else {
				// getMsg()
				// io.emit('client-send-msg', msg);
			}
		});
	});
});

server.listen(8888);