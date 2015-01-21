var Weibo = require('nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var utility = require('zh.asoiaf.utility');
var wikia = new utility.Wikia();
var request = require('request').defaults({ encoding: null });;
var BufferList = require('bufferlist').BufferList;
var FormData = require('form-data');
var levenshtein = require('levenshtein-edit-distance');
var bot = require('nodemw');

  // pass configuration object
  var client = new bot({
    "server": 'zh.asoiaf.wikia.com',  // host name of MediaWiki-powered site
    "path": '',                  // path to api.php script
    "debug": false ,                // is more verbose when set to true
    "username": process.env.PASSWORD,
	"password": process.env.USERNAME
  });
var globalVar = {
		"debug": true, 
		"MSG_NOFOUND":"没找到相关信息。", 
		"MSG_ERR":"没玉米了，服务器罢工了。",
		"character_days_in_power":5,
		"character":"丹妮莉丝·坦格利安"
	};
module.exports = {
	init: function(){
		client.getArticle("Mediawiki:top/character", function(err, data){
			if (err){
				if(globalVar.debug){
					console.log("err, default:character "+globalVar.character);
				}
				return;
			}
			globalVar.character = data;
			if(globalVar.debug)
				console.log("character"+data);
		});
		client.getArticle("Mediawiki:top/character_days_in_power", function(err, data){
			if (err){
				if(globalVar.debug){
					console.log("err, default:character_days_in_power "+globalVar.character_days_in_power);
				}
				return;
			}
			globalVar.character_days_in_power = data;
			if(globalVar.debug){
				console.log("character_days_in_power "+data);
			}
		});
	},
	comment: function(source, access_token, arg_query, arg_id, arg_cid){
		var query = arg_query;
		var id = arg_id;
		var cid = arg_cid;
		wikia.info({title:query}, function(err, obj){
			if((err=''||err==null) && obj != null){
				if (cid == null){
					var para = {
					    "source": source,
					    "access_token": access_token,
					    "comment": obj.abstract.substring(0,120)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + obj.id,
					    "id" : id
					}
		
					Weibo.Comments.create(para, function(data){
						if (globalVar.debug){
							console.log(data);
						}
					});
					
				}else{
					var para = {
					    "source": source,
					    "access_token": access_token,
					    "comment": obj.abstract.substring(0,110)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + obj.id,
					    "id" : id,
					    "cid" : cid
					}
					Weibo.Comments.reply(para, function(data){
						if (globalVar.debug){
							console.log(data);
						}
					});

				}
	
			}else{
				wikia.search(query, function(err, items) {

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
						if(msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND && levenshtein(query, items[0].title) < 10){
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
						if(msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND && levenshtein(query, items[0].title) < 10){
							Weibo.Comments.reply(para, function(data){
								if (globalVar.debug){
									console.log(data);
								}
							});
						}
					}
				});
			}

		});

	},
	status: function(source, access_token, content, username){
		wikia.info({title:content}, function(err, obj){
			if((err=''||err==null) && obj != null){
				var para = {
				    "source": source,
				    "access_token": access_token,
				    "status": "@"+username+" "+obj.abstract.substring(0,110)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + obj.id ,  
				}
				Weibo.Statuses.update(para, function(data){
					if (globalVar.debug){
						console.log(data);
					}
				}); 		
			}else{
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
					if( msg != globalVar.MSG_ERR && msg != globalVar.MSG_NOFOUND && levenshtein(query, items[0].title) < 8){

						Weibo.Statuses.update(para, function(data){
							if (globalVar.debug){
								console.log(data);
							}
						}); 

					}
					
				});
			}
		})

	},
	specialStatus: function(source, access_token, type){

		if(type == "most viewed"){
			url = "http://zh.asoiaf.wikia.com/api/v1/Articles/Top?namespaces=0&category=%E4%BA%BA%E7%89%A9&limit=1";
			request.get(url, function(err, res, body){
				if (!err && res.statusCode == 200) {

					var items = JSON.parse(body).items;
					var winner = items[0].title;
					var obj = {};

					obj.title = decodeURI(winner);
					obj.width = 360;
					obj.height = 480;
					obj['abstract'] = 120;
					if (globalVar.debug){
						console.log(obj);
					}

					wikia.info(obj, function(err, data){
						if(!err){
							var msg = "";
							var imageurl = "";
							

							msg = "昨日冰与火之歌中文维基最受关注的人物是";
							msg += data.title;
							if(data.title == globalVar.character){
								msg += "，这已经是";
								msg += data.title;
								msg += "连续第";
								msg += globalVar.character_days_in_power;
								msg += "天登上榜首。";
								msg += "http://zh.asoiaf.wikia.com";
								msg += "/index.php?curid=";
								msg += data.id;
								imageurl = data.thumbnail;	
								globalVar.character_days_in_power++;	
								_updateCharacterDaysInPower();						
							}else{
								msg += "。";
								msg += data.title;
								msg += "取代了";
								msg += globalVar.character;
								msg += "登上榜首。";
								msg += "http://zh.asoiaf.wikia.com";
								msg += "/index.php?curid=";
								msg += data.id;
								imageurl = data.thumbnail;	
								globalVar.character = data.title;	
								globalVar.character_days_in_power = 1;	
								_updateCharacter();	
								_updateCharacterDaysInPower();					
							}

							
							_postStatusWithImage(source, access_token, msg, imageurl);

						}
					});
				}else{
					if(globalVar.debug){
						console.log(err);
						globalVar.character_days_in_power++;
						_updateCharacterDaysInPower();	
					}
				}
			});
			

		}
	},

	random: function(source, access_token){
		url="http://zh.asoiaf.wikia.com/api.php?action=query&list=random&rnlimit=1&format=json&rnnamespace=0|114"
		var my_source = source, my_token = access_token;

		request.get(url, function(err, res, body){
			if (!err && res.statusCode == 200) {
				var query = JSON.parse(body).query;
				var winner = query.random[0].title;
				if(globalVar.debug)
					console.log(winner);
				_statusWithImage(my_source, my_token, winner );
			}
		});
	}

	

}
var _updateCharacter = function(){
	client.edit("Top/character", globalVar.character,"bot",null);
}
var _updateCharacterDaysInPower = function(){
	client.edit("Top/character_days_in_power", globalVar.character_days_in_power,"bot",null);
}
var _statusWithImage= function(source, access_token, title){
	var obj = {};
	var msg;
	var imageurl;
	obj.title = title;
	obj.width = 360;
	obj.height = 480;
	obj['abstract'] = 500;

	wikia.info(obj, function(err, data){
		if(globalVar.debug){
			console.log(data);
		}
		if(!err){
			/* prelimiary quality check */
			if (data.abstract.length < 30 || data.abstract.indexOf('，')=='-1'|| data.type != 'article'){
				return;
			}
			
			msg = data.abstract.substring(0, 120);
			msg += "..."
			msg += "http://zh.asoiaf.wikia.com"
			msg += "/index.php?curid=";
			msg += data.id;
			imageurl = data.thumbnail;
			
			_postStatusWithImage(source, access_token, msg, imageurl);

		}
	});
}
var _postStatusWithImage = function(source, access_token, msg, imageurl){
	if (imageurl == null || imageurl == ""){
		var para = {
			"source" : source,
			"access_token" : access_token,
			"status" : msg
		}
		Weibo.Statuses.update(para, function(data){
			if (globalVar.debug){
				console.log(data);
			}

		}); 

	}else{
		if(globalVar.debug)
			console.log(imageurl);
	    // var bl = new BufferList();
	    var form = new FormData();
	    form.append('source',source);
	    form.append('access_token', access_token);
	    form.append('status', msg);
	    form.append('pic', request(imageurl));
		
		form.submit('https://api.weibo.com/2/statuses/upload.json', function(err, res) {
			if(globalVar.debug){
				console.log(res);
			}
			res.resume();
		  // res – response object (http.IncomingMessage)  //
		  // for node-0.10.x
		});
	  //   request({uri:imageurl, responseBodyStream: bl}, function (error, response, body) {
	  //       if (!error && response.statusCode == 200) {
	  //       	var form = new FormData();

		 //        var para = {
			// 		"source" : source,
			// 		"access_token" : access_token,
			// 		"status" : msg,
			// 		"pic" : image
			// 	}
			// 	Weibo.Statuses.upload(para, function(data){
			// 		if (globalVar.debug){
			// 			console.log(data);
			// 		}
			// 	});
			// }

	  //   });

	}		
};