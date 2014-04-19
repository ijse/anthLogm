var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var LogService = require('../service/logService');

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
		var endpoint = socket.manager.handshaken[socket.id];
		console.log('Client connected from: ', endpoint);
		io.sockets.emit('message', {
			msg: "Welcome client: [" + endpoint.address.address + ":" + endpoint.address.port + "]",
			date: endpoint.time
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
				case 'help':
					resp = "Commands avaliable: \n" +
						" help              Show this message.\n" +
						" watch &lt;logName&gt;   Follow the logs.\n" +
						" list              List avaliable logs.\n" +
						"";

					break;
				case 'watch':
					var logName = data.args[0];

					if(!logName) {
						resp = 'Need logName!';
						break;
					}

					// Check all rooms,
					// console.log(io.sockets.manager.rooms);
					if(!io.sockets.manager.rooms[logName]) {
						// Start new pipe
						LogService.pipeLog(path.join(__dirname, logName), function(data) {
							// Success pipe logs, join the room
							socket.join('LogRoom:' + logName);

							io.sockets.in('LogRoom:' + logName).emit('out-log', {
								msg: data.toString()
							});
						}, function(data) {
							// Command execute failed
							io.sockets.emit('out-log', {
								msg: data.toString()
							});
						});
					}


					break;
				case 'listLogs':
					resp = io.sockets.manager.roomClients[socket.id];
					resp = JSON.stringify(resp);
					// console.log(resp);
					break;
				default:
					resp = 'What? Go try `help`.';
			}
			io.sockets.emit('command', {
				msg: ">> " + data.cmd + ' ' + data.args.join(' '),
				resp: resp
			});

			fn();
		});

	});

}