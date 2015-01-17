var Weibo = require('nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var sleep = require('sleep');
var schedule = require('node-schedule');
var adapter = require('./adapter.js');


var express = require('express');
var globalVar = 
{
	"code": "1c39f884e6a369cd87089e4c44a8ad6d",
	"lastMentionId" : 0,
	"lastMentionInCommentsId": 0, 
	"debug": true, 
	"access_token":"2.00rVrrrCblWJNE9bfb3884beZx5dnC",
	"character_days_in_power":0,
	"character":"无"
}

var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.get('/', function(request, response) {
	response.send('Welcome!');
});

app.get('/auth', function(request, response) {
	globalVar.code = request.code;
  	response.redirect('/access_token');
});

app.get('/fan', function(request, response){
	var echostr = request.query.echostr;
	respond.send(echostr);
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
	    response.send('Authenticated!');
	});
  	
});


app.listen(app.get('port'), function() {
	console.log('server start...');
  	/*
    initialize weibo before using it
 	*/
	Weibo.init(setting);


	var para = {
	    "source": Weibo.appKey.appKey,
	    "access_token": globalVar.access_token,
	    "since_id": globalVar.lastMentionId,
	    "count": 1
	}
	Weibo.Statuses.mentions(para, function(data){
		if (globalVar.debug){
			console.log(data);
		}
		globalVar.lastMentionId = data.statuses[0].id;
	});
	var para = {
	    "source": Weibo.appKey.appKey,
	    "access_token": globalVar.access_token,
	    "since_id": globalVar.lastMentionInCommentsId,
	    "count": 1
	}
	Weibo.Comments.mentions(para, function(data){
		if (globalVar.debug){
			console.log(data);
		}
		globalVar.lastMentionInCommentsId = data.comments[0].id;
	});
	if(globalVar.debug){
 		//adapter.random(Weibo.appKey.appKey,globalVar.access_token);
 	}



	/*
	+-------------------------------------------------
	例1：开启微博认证
	启动认证后，将在浏览器器打开一个窗口，url中含有code参数
	注意：运行其中一个例子时，须注释掉另一个例子。
	+-------------------------------------------------
	*/

	//Weibo.authorize();

	// var jsonParas = {
	//     code:"102210cb33e211c243e491370f071ba2",
	//     grant_type:"authorization_code"
	// };

	// Weibo.OAuth2.access_token(jsonParas,function(data){
	//     console.log(data);
	// });


	var rule = new schedule.RecurrenceRule();
	rule.second = 1;

	var replyToMentions = schedule.scheduleJob(rule, function(){
		/*if no last mention found in record, then it must have
		 been called before we finish initialization.
		 Thus, we will abort this job if no record found.
		*/
		if(globalVar.lastMentionId == 0 ){
			return
		}
		var para = {
		    "source": Weibo.appKey.appKey,
		    "access_token": globalVar.access_token,
		    "since_id": globalVar.lastMentionId
		}
		Weibo.Statuses.mentions(para, function(data){
			if (globalVar.debug){
				console.log(data);
			}
			if (data.statuses[0] == null)
				return;
			globalVar.lastMentionId = data.statuses[0].id;

			for (mention in data.statuses){
				var username = data.statuses[mention].user.screen_name;
				var content = data.statuses[mention].text;
				if (data.statuses[mention].retweeted_status!=null){
					if (content.indexOf('@') > content.indexOf('//') && content.indexOf('//')!= -1 ){
						return;
						/* 这里有个bug，待解决*/
					}
				}
				content = content.replace(/(|^)@\S+/,'');
				content = content.substring(0, content.indexOf('//'));
				var id = data.statuses[mention].id;

				if (data.statuses[mention].user.allow_all_comment){
					adapter.comment(Weibo.appKey.appKey, globalVar.access_token, content, id, null);
					sleep.sleep(5);
				}else{		
					adapter.status(Weibo.appKey.appKey, globalVar.access_token, content, username);
					sleep.sleep(5);

				}
			}
		});
	});
	rule = new schedule.RecurrenceRule();
	rule.second = 30;
	var replayToMentionsInComments = schedule.scheduleJob(rule, function(){
		/*if no last comment found in record, then it must have
		 been called before we finish initialization.
		 Thus, we will abort this job if no record found.
		*/
		if(globalVar.lastMentionInCommentsId == 0 ){
			return;
		}

		var para = {
		    "source": Weibo.appKey.appKey,
		    "access_token": globalVar.access_token,
		    "since_id": globalVar.lastMentionInCommentsId
		}

		Weibo.Comments.mentions(para, function(data){
			if (globalVar.debug){
				console.log(data);
			}	
			if (data.comments[0] == null)
				return;	
			globalVar.lastMentionInCommentsId = data.comments[0].id;

			for (mention in data.comments){
				var username = data.comments[mention].user.screen_name;
				var content = data.comments[mention].text.replace(/(|^)@\S+/,'');
				var id = data.comments[mention].status.id;
				var cid = data.comments[mention].id;
				if (data.comments[mention].status.user.allow_all_comment){
					adapter.comment(Weibo.appKey.appKey, globalVar.access_token, content, id, cid);
					sleep.sleep(5);
				}else{
					adapter.status(Weibo.appKey.appKey,globalVar.access_token,content, username);
					sleep.sleep(5);

				}
			}
		});
	});
	rule = new schedule.RecurrenceRule();
	rule.hour = 8;
	rule.minute = 30;
	var postMostViewedCharacter = schedule.scheduleJob(rule, function(){
		adapter.specialStatus(Weibo.appKey.appKey,globalVar.access_token,"most viewed");


	});
	rule = new schedule.RecurrenceRule();
	rule.hour = [9, 11, 13, 14, 15, 16, 17, 20, 21];
	rule.minute = 0;
	var postRandomArticle = schedule.scheduleJob(rule, function(){
		adapter.random(Weibo.appKey.appKey,globalVar.access_token);
	});

});

