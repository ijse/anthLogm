var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;


exports.serve = function(io) {

	var logFile = path.join(__dirname, '../logs.log');

	// var tail = spawn('tail', ['-f', logFile])
	// tail.stdout.on('data', function(data) {
	// 	console.log('tail:out ', data);
	// 	io.sockets.emit('out-log', { msg: data.toString() });
	// })

	// tail.stderr.on('data', function (data) {
	// 	console.log('tail:err: ' + data);
	// 	io.sockets.emit('out-log', { msg: data.toString() });
	// });

	io.sockets.on('connection', function (socket) {
		var endpoint = socket.manager.handshaken[socket.id].address;
		console.log('Client connected from: ' + endpoint.address + ":" + endpoint.port);
		io.sockets.emit('message', {
			msg: "Welcome client: " + endpoint.address + ":" + endpoint.port
		});

		socket.on('subscribe', function(room) {
			console.log('joining room', room);

			socket.join(room);
		});

		socket.on('unsubscribe', function(room) {
			console.log('leaving room', room);

			socket.leave(room);
		});

		socket.on('command', function(data, fn){
			console.log('Receive command: ', data);
			data.args = [].concat(data.args);

			var resp = '';
			switch(data.cmd) {
				case 'open':

					break;
				case 'my-rooms':
					resp = io.sockets.manager.roomClients[socket.id];
					console.log(resp);
					break;
				default:
			}
			io.sockets.emit('command', {
				msg: ">> " + data.cmd + ' ' + data.args.join(' '),
				resp: resp
			});

			fn();
		});

	});

}