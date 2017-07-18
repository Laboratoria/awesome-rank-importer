var express = require('express');
var busboy = require('connect-busboy');
var xlsx = require('xlsx');

var app = express();

var fs = require('fs');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var models = require('./models');
var encrypt = require('./helper/encrypt');

app.set('port', process.env.PORT || 3000);

var readXLS, writeToDatabase;

io.on('connection', function (socket) {
	console.log('User connected');

	readXLS = function (filePath, res) {
		var workbook = xlsx.readFile(filePath);
		var worksheet = workbook.Sheets['data'] || workbook.Sheets[0];
		var range = worksheet['!ref'];
		var lastPositionIndex = range.indexOf(':') + 2;
		var lastRow = range.substr(lastPositionIndex);
		socket.emit('message', 'INFO: Starting import process...');
		for (var r = 3; r < lastRow; r++) {
			if (worksheet['D' + r]) {
				var user = {
					'name': worksheet['A' + r].v,
					'lastname': worksheet['B' + r] ? worksheet['B' + r].v : '',
					'company': worksheet['C' + r].v,
					'username': worksheet['D' + r].v,
					'password': encrypt(worksheet['E' + r].v.trim()),
					'campusId': worksheet['F' + r].v
				};
				var squad = {
					'name': worksheet['G' + r].v
				};
				var developer = {
					'name': worksheet['H' + r].v,
					'lastname': worksheet['I' + r].v,
					'age': 0,
					'photoUrl': worksheet['K' + r].v,
					'title': worksheet['L' + r].v,
					'captainLink': worksheet['M' + r].v,
					'campusId': user.campusId
				};
				writeToDatabase({ user, squad, developer });
			} else {
				res.end('INFO: Data Imported');
			}
		}
	};

	writeToDatabase = function (importEntities) {

		var user = importEntities.user;
		var squad = importEntities.squad;
		var developer = importEntities.developer;

		return (function () {
			models.User.findOrCreate({
				where: {
					username: user.username
				},
				defaults: user
			}).spread(function (user, created) {
				if (created) {
					socket.emit('message', `INFO: User ${user.name} ${user.lastname} imported...`);
				}
				squad.userId = user.id;
				return models.Squad.findOrCreate({
					where: {
						name: squad.name
					},
					defaults: squad
				});
			}).spread(function (squad, created) {
				if (created) {
					socket.emit('message', `INFO: Squad ${squad.name} imported...`);
				}
				developer.squadId = squad.id;
				return models.Developer.findOrCreate({
					where: {
						'name': developer.name,
						'lastname': developer.lastname,
						'campusId': developer.campusId
					},
					defaults: developer
				});
			}).spread(function (developer, created) {
				if (created) {
					socket.emit('message', `INFO: Developer ${developer.name} ${developer.lastname} imported...`);
				}
			});
		})();
	}
});

app.use(busboy());

app.use('/static', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	return res.sendFile(__dirname + '/public/index.html');
});

app.post('/import', function (req, res) {
	if (req.busboy) {
		var stream;
		req.pipe(req.busboy);
		req.busboy.on('file', function (fieldname, file, filename) {
			var uploadDir = __dirname + '/uploads/';
			var filePath = uploadDir + filename;
			if (!fs.existsSync(uploadDir)) {
				fs.mkdirSync(uploadDir);
			}
			stream = fs.createWriteStream(filePath);
			file.pipe(stream);
			stream.on('close', function () {
				readXLS(filePath, res);
			});
		});
	} else {
		res.send(new Error('ERROR: File not found...'));
	}
});

http.listen(app.get('port'), function () {
	console.log(`Server running on port ${app.get('port')}`);
});
