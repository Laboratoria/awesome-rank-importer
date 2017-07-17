var socket = io();

var writeLog = function (message) {
	var $p = $('<p />');
	$p.text(message);
	$('.log-area').append($p);
};

var writeStatus = function (status) {
	$('#status').text(status);
};

var importData = function (e) {
	e.preventDefault();
	var url = $(this).attr('action');
	var file = $('#hackathon-data')[0].files[0];
	var data = new FormData();
	data.append('hackathon-data', file);

	$.ajax({
		url: url,
		type: 'POST',
		data: data,
		contentType: false,
		processData: false
	}).then(function (response) {
		console.log('res', response);
		writeStatus('Imported');
	}).fail(function (error) {
		console.log('err', error);
		writeStatus('Error ' + error.message);
	});
};

var changeStatus = function (e) {
	var isReady = e.target.files.length > 0;
	if (isReady) {
		writeLog('INFO: File ready to import');
		writeStatus('Ready to import');
	}
};

$('#import-form').submit(importData);
$('#hackathon-data').change(changeStatus);
// $('select').material_select();

socket.on('message', writeLog);
