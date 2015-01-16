var Weibo = require('nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
var utility = require('zh.asoiaf.utility');
var wikia = new utility.Wikia();

var globalVar = {"debug": true, "MSG_NOFOUND":"没找到相关信息。", "MSG_ERR":"没玉米了，服务器罢工了。"};
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
				Weibo.Comments.create(para, function(data){
					if (globalVar.debug){
						console.log(data);
					}
				});
			}else{
				var para = {
				    "source": source,
				    "access_token": access_token,
				    "comment": msg == null ? items[0].abstract.substring(0,110)+"... http://zh.asoiaf.wikia.com/index.php?curid=" + items[0].id : msg,
				    "id" : id,
				    "cid" : cid
				}
				Weibo.Comments.reply(para, function(data){
					if (globalVar.debug){
						console.log(data);
					}
				});
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
			Weibo.Statuses.update(para, function(data){
				if (globalVar.debug){
					console.log(data);
				}
			}); 
			
		});
	}

}