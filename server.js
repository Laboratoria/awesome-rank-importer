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

var asyncLoop,
	getCellValue,
	readXLS,
	writeToDatabase;

io.on('connection', function (socket) {
	console.log('User connected');

	asyncLoop = function (iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
	}

	getCellValue = function (worksheet, column, row) {
		return worksheet[column + row] ? worksheet[column + row].v : '';
	};

	readXLS = function (filePath, res) {
		var workbook = xlsx.readFile(filePath);
		var worksheet = workbook.Sheets['data'] || workbook.Sheets[0];
		var range = worksheet['!ref'];
		var lastPositionIndex = range.indexOf(':') + 2;
		var lastRow = range.substr(lastPositionIndex);
		socket.emit('message', 'INFO: Starting import process...');
		console.log('message', 'INFO: Starting import process...');
		asyncLoop(lastRow - 3, function (loop) {
			var r = loop.iteration() + 3;
			if (worksheet['D' + r]) {
				var user = {
					'name': getCellValue(worksheet, 'A', r),
					'lastname': getCellValue(worksheet, 'B', r),
					'company': getCellValue(worksheet, 'C', r),
					'username': getCellValue(worksheet, 'D', r),
					'password': encrypt(worksheet['E' + r].v.trim()),
					'campusId': getCellValue(worksheet, 'F', r)
				};
				var squad = {
					'name': getCellValue(worksheet, 'G', r)
				};
				var developer = {
					'name': getCellValue(worksheet, 'H', r),
					'lastname': getCellValue(worksheet, 'I', r),
					'age': 0,
					'photoUrl': getCellValue(worksheet, 'K', r),
					'title': getCellValue(worksheet, 'L', r),
					'captainLink': getCellValue(worksheet, 'M', r),
					'campusId': user.campusId
				};
				writeToDatabase({ user, squad, developer }, loop);
			} else {
				res.end('INFO: Data Imported');
			}
		}, function () {
			console.log('INFO: Data Imported, async');
		});
	};

	writeToDatabase = function (importEntities, loop) {

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

			console.log('message', `INFO: User ${user.name} ${user.lastname} imported...`);
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

			console.log('message', `INFO: Squad ${squad.name} imported...`);
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

			console.log('message', `INFO: Developer ${developer.name} ${developer.lastname} imported...`);
		}
				loop.next();
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
