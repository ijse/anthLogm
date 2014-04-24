

var spawn = require('child_process').spawn;

var buildCmd = function(cmd, args, out, err) {
	command = spawn(cmd, args);

	command.stdout.on('data', out);
	command.stderr.on('data', err || out);

	return {
		kill: function() {
			// command.kill('SIGTERM');
			command.kill('SIGHUP');
		}
	}
};


exports.pipeLog = function(logName, out, err) {
	buildCmd('tail', [ '-f', logName], out, err);
}

exports.loadLog = function(logName, out, err) {
	// Create readStream for logName
}