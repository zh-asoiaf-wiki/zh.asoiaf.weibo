var Weibo = require('nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var utility = require('zh.asoiaf.utility');
var wikia = new utility.Wikia();
var request = require('request');
var globalVar = {
		"debug": true, 
		"MSG_NOFOUND":"没找到相关信息。", 
		"MSG_ERR":"没玉米了，服务器罢工了。",
		"character_days_in_power":1,
		"character":"琼恩·雪诺"
	};
module.exports = {
	comment: function(source, access_token, content, id, cid){
		wikia.search(content, function(err, items) {
			var msg = null;
			if (err) {
				msg = globalVar.MSG_NOFOUND;
			} else if (!items || items.length == 0) {
				msg = globalVar.MSG_ERR
			} else {
				//it is a successful search
			}
			if (cid == null){
				var para = {
				    "source": source,
				    "access_token": access_token,
				    "comment": msg == null ? items[0].abstract.substring(0,120)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + items[0].id : msg,
				    "id" : id
				}
				if(msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND){
					Weibo.Comments.create(para, function(data){
						if (globalVar.debug){
							console.log(data);
						}
					});
				}
			}else{
				var para = {
				    "source": source,
				    "access_token": access_token,
				    "comment": msg == null ? items[0].abstract.substring(0,110)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + items[0].id : msg,
				    "id" : id,
				    "cid" : cid
				}
				if(msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND){
					Weibo.Comments.reply(para, function(data){
						if (globalVar.debug){
							console.log(data);
						}
					});
				}
			}
		});
		return 

	},
	status: function(source, access_token, content, username){
		wikia.search(content, function(err, items) {
			var msg = null;
			if (err) {
				msg = globalVar.MSG_NOFOUND;
			} else if (!items || items.length == 0) {
				msg = globalVar.MSG_ERR
			} else {
				//it is a successful search
			}
			var para = {
			    "source": source,
			    "access_token": access_token,
			    "status": msg == null ? "@"+username+" "+items[0].abstract.substring(0,110)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + items[0].id : msg,  
			}
			if(msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND){

				Weibo.Statuses.update(para, function(data){
					if (globalVar.debug){
						console.log(data);
					}
				}); 

			}
			
		});
	},
	specialStatus: function(source, access_token, type){

		if(type == "most viewed"){
			url = "http://zh.asoiaf.wikia.com/api/v1/Articles/Top?namespaces=0&category=%E4%BA%BA%E7%89%A9&limit=1";
			request.get(url, function(err, res, body){
				if (!err && res.statusCode == 200) {
					var winner = res.items[0].title;
					var obj = {};
					var msg;
					var imageurl;
					obj.title = winner;
					obj.width = 600;
					obj.height = 800;
					obj['abstract'] = 120;
					wikia.info(obj, function(err, data){
						if(!err){
							for (var id in data.items){
								msg = "昨日冰与火之歌中文维基最受关注的人物是"
								msg += data.items[id].title;
								if(title == globalVar.character){
									msg += "，这已经是";
									msg += data.items[id].title;
									msg += "连续第";
									msg += globalVar.character_days_in_power;
									msg += "天登上榜首。";
									msg += data.items[id].basepath;
									msg += "/index.php?curid=";
									msg += data.items[id].id;
									imageurl = data.items[id].thumbnail;	
									globalVar.character_days_in_power++;						
								}else{
									msg += "。";
									msg += data.items[id].title;
									msg += "取代了昨天的";
									msg += globalVar.character;
									msg += "登上榜首。";
									msg += data.items[id].basepath;
									msg += "/index.php?curid=";
									msg += data.items[id].id;
									imageurl = data.items[id].thumbnail;	
									globalVar.character = data.items[id].title;	
									globalVar.character_days_in_power = 1;							
								}

							}
							_postStatusWithImage(source, access_token, msg, imageurl);

						}
					});
				}else{
					if(globalVar.debug){
						console.log(err);
						globalVar.character_days_in_power++;
					}
				}
			});
			

		}
	},
	statusWithImage: function(source, access_token, title){
		var obj = {};
		var msg;
		var imageurl;
		obj.title = title;
		obj.width = 600;
		obj.height = 800;
		obj['abstract'] = 120;

		wikia.info(obj, function(err, data){
			if(!err){
				for (var id in data.items){
					msg = data.items[id].abstract;
					msg += data.items[id].basepath;
					msg += "/index.php?curid=";
					msg += data.items[id].id;
					imageurl = data.items[id].thumbnail;
				}
				_postStatusWithImage(source, access_token, msg, imageurl);

			}
		});
	}

	

}
var _postStatusWithImage = function(source, access_token, msg, imageurl){
	if (imageurl == null){
		var para = {
			"source" : source,
			"access_token" : access_token,
			"status" : msg,
		}
		Weibo.Statuses.update(para, function(data){
			if (globalVar.debug){
				console.log(data);
			}

		}); 

	}else{
	    var bl = new BufferList();
	    request({uri:imageurl, responseBodyStream: bl}, function (error, response, body) {
	        if (!error && response.statusCode == 200) {
		        // var data_uri_prefix = "data:" + response.headers["content-type"] + ";base64,";
		        var image = new Buffer(bl.toString(), 'binary').toString('base64');  
		        var para = {
					"source" : source,
					"access_token" : access_token,
					"status" : msg,
					"pic" : image
				}
				Weibo.Statuses.upload(para, function(data){
					if (globalVar.debug){
						console.log(data);
					}
				});
			}

	    });

	}		
};