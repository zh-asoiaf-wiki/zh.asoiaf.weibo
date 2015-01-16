
var Weibo = require('nodeweibo');    // require('nodeweibo') also works if you have installed nodeweibo via npm
var setting = require('./setting.json');   // get setting (appKey, appSecret, etc.)
/*
+-------------------------------------------------
(1)注册账号：http://open.weibo.com/
(2)在./setting.json中配置您的开发账号。
(3)搞清楚微博的认证机制即oauth2.0认证原理。
(4)第3点很重要，确保你理解这种开放方式。
+-------------------------------------------------
*/
/*
    initialize weibo before using it
 */
Weibo.init(setting);




/*
+-------------------------------------------------
例1：开启微博认证
启动认证后，将在浏览器器打开一个窗口，url中含有code参数
注意：运行其中一个例子时，须注释掉另一个例子。
+-------------------------------------------------
*/

Weibo.authorize();
