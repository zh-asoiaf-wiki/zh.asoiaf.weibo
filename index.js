var Weibo = require('../../nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var sleep = require('sleep');
var schedule = require('node-schedule');
var adapter = require('./adapter.js');

var express = require('express');
var globalVar = 
{
	"code": 0,
	"lastMentionId" : 0,
	"lastMentionInCommentsId": 0, 
	"debug": true, 
	"access_token":"74be5a09fc620255953f11ed46cb6c44"
}
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
	globalVar.code = request.code;
  	response.send('Authenticated!');
});

app.get('/access_token', function(request, response) {
	var jsonParas = {
	    code:globalVar.code,
	    grant_type:"authorization_code"
	};

	Weibo.OAuth2.access_token(jsonParas,function(data){
		if(globalVar.debug){
			console.log(data);
		}
	    globalVar.access_token = data.access_token;
	});
  	response.send('Authenticated!');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});


