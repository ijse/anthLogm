'use strict';

var path = require('path');

var LogService = require('../service/logService');

exports.serve = function (io) {

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
			msg: 'Welcome client: [' + endpoint.address.address + ':' + endpoint.address.port + ']',
			date: endpoint.time
		});

		// Client disconnect, leave rooms
		socket.on('disconnect', function () {
			io.sockets.emit('message', {
				msg: 'Client: [' + endpoint.address.address + ':' + endpoint.address.port + '] leave.',
				date: endpoint.time
			});
		});

		socket.on('subscribe', function (room) {
			console.log('joining room', room);

			socket.join(room);
		});

		socket.on('unsubscribe', function (room) {
			console.log('leaving room', room);

			socket.leave(room);
		});

		socket.on('command', function (data, fn) {
			console.log('Receive command: ', data);
			data.args = [].concat(data.args);

			var resp = '';
			switch (data.cmd) {
			case 'help':
				resp = 'Commands avaliable: \n' +
					' help              Show this message.\n' +
					' watch &lt;logName&gt;   Follow the logs.\n' +
					' listLogs              List avaliable logs.\n' +
					'';

				break;
			case 'watch':
				var logName = data.args[0];

				if (!logName) {
					resp = 'Need logName!';
					break;
				}

				var logFile = path.join(__dirname, logName);
				var roomName = 'LogRoom:' + logFile;

				// Check all rooms,
				// console.log(io.sockets.manager.rooms);
				if (!io.sockets.manager.rooms[logName]) {
					// Start new pipe
					var pipeHandler = LogService.pipeLog(logFile, function (data) {
						// Success pipe logs, join the room
						socket.join(roomName);

						io.sockets.in(roomName).emit('out-log', {
							msg: data.toString()
						});
					}, function (data) {
						// Command execute failed
						io.sockets.emit('out-log', {
							msg: data.toString()
						});
					});

					// Stop piping when there is no client connected
					socket.once('disconnect', function () {
						var clientsInRoom = io.sockets.clients(roomName);

						// Check clients online
						if (1 > clientsInRoom.length) {
							pipeHandler.kill();
						}
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
			socket.emit('command', {
				msg: '>> ' + data.cmd + ' ' + data.args.join(' '),
				resp: resp
			});

			fn();
		});


	});

};