// connect to our socket server
var socket = io.connect('http://127.0.0.1:1337/');

var app = app || {};


// shortcut for document.ready
$(function(){
	//setup some common vars
	var $blastField = $('#blast'),
		$allPostsTextArea = $('#allPosts'),
		$clearAllPosts = $('#clearAllPosts'),
		$sendBlastButton = $('#send');

	var addContent = function(content) {
		var copy = $allPostsTextArea.html();
		$allPostsTextArea.html(copy + content);
		$allPostsTextArea.scrollTop($allPostsTextArea[0].scrollHeight - $allPostsTextArea.height());
		//.css('scrollTop', $allPostsTextArea.css('scrollHeight'));
	}

	//SOCKET STUFF
	socket.on("out-log", function(data){
		var content = data.msg.replace(/\r\n/g, '<br>');
		addContent('<pre>' + content + '</pre>');
	});

	socket.on("message", function(data) {
		var content = data.msg;
		addContent('<p class="text-warning">' + content + '</p>');
	});
	socket.on("command", function(data) {
		var content = data.msg;
		addContent('<p class="text-info">' + data.msg + '</p>');
		addContent('<pre>' + data.resp + '</pre>');
	});

	$clearAllPosts.click(function(e){
		$allPostsTextArea.text('');
	});

	$sendBlastButton.click(function(e){

		var blast = $blastField.val();
		if(!blast) {
			return ;
		}
		var arr = blast.split(' ');
		var cmd_name = arr[0];
		var cmd_args = arr.splice(1);

		if(blast.length){
			socket.emit("command", {cmd: cmd_name, args: cmd_args },
				function(data){
					$blastField.val('');
				});
		}

	});

	$blastField.keydown(function (e){
	    if(e.keyCode == 13){
	        $sendBlastButton.trigger('click');//lazy, but works
	    }
	})

});