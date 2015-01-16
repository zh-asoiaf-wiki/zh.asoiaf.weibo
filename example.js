
var Weibo = require('../../nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var sleep = require('sleep');
var schedule = require('node-schedule');
var adapter = require('./adapter.js');
/*
+-------------------------------------------------
(1)注册账号：http://open.weibo.com/
(2)在./setting.json中配置您的开发账号。
(3)搞清楚微博的认证机制即oauth2.0认证原理。
(4)第3点很重要，确保你理解这种开放方式。
+-------------------------------------------------
*/
var globalVar = {"lastMentionId":0, "lastMentionInCommentsId":0,"debug": true, "access_token":"2.00koSbxFblWJNEdf2682b10c92QEbD"}
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
		globalVar.lastMentionId = data.statuses[0].id;

		for (mention in data.statuses){
			var username = data.statuses[mention].user.screen_name;
			var content = data.statuses[mention].text.replace(/(|^)@\S+/,'');
			var id = data.statuses[mention].id;
			if (data.statuses[mention].user.allow_all_comment){
				adapter.comment(Weibo.appKey.appKey, access_token, content, id, null);
				sleep.sleep(5);
			}else{		
				adapter.status(Weibo.appKey.appKey, access_token, content, id, null);
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
		return
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

// Weibo.Statuses.public_timeline(para, function(data){
//     console.log(data);
// });
// Weibo.Statuses.update(para, function(data){
// 	console.log(data);
// });
/*
+--------------------------------------------------
例2：需要获取access_token
(1)阅读微博开放平台API
   如：http://open.weibo.com/wiki/OAuth2/access_token，
   将必要的参数写进jsonParas对象。
(2)在回调中打印出获取的数据
(3)code是您浏览器窗口获得的code。
(4)注意：如运行本例子，请注释掉第1个例子，且code职能调用一次，
        会随着认证不断更新。一个用户一个access_token。
+---------------------------------------------------
*/
// var jsonParas = {
//     code:"the value of your browser's parameter code",
//     grant_type:"authorization_code"
// };

// Weibo.OAuth2.access_token(jsonParas,function(data){
//     console.log(data);
// });


/*
    example 3, get public timeline
 */

// // set parameters
// var para = {
//     "source": Weibo.appKey.appKey,
//     "access_token": 'your access_token here'
// };

// // get public timeline
// Weibo.Statuses.public_timeline(para, function(data){
//     console.log(data);
// });