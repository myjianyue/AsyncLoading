function AsyncLoading (option){
	this.instanceOption = option || null;
	this.componentRelativePath = null;
	this.currentMoudleHTMLParentel = null;
	this.currentComponentName = null;
	this.mount = {
		isAuto : true,
		position:1,
		type:'outside'
	};	//默认设置挂载信息
	this._callback = null;
	this._callBackQueue = [];
	this.resultReport = {};		//模块加载后的返回信息
	this.moudleInfo = null;
	this.cache = {
		moudleCacheLevel : 10,	//允许缓存的Moudle个数
		moudleCacheList :[]
	};
	this.bsEnv = function(){
        var u = navigator.userAgent, app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
            iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
            weChat: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
            qq: u.match(/\sQQ/i) == " qq" //是否QQ
        };
    }();
};

//获得组件 (组件对应的是：html,css,js为同一文件夹的相同文件名的一类文件集合)
AsyncLoading.prototype.getComponent = function(componentName,option,callback){
	this._init(option,'getComponent');
	this.currentComponentName = componentName;
	this.currentMoudleHTMLParentel = option.parentElement;
	var getComponentFromCache = this.isHasCache(componentName);
	if(getComponentFromCache == null){
		/* 设置回调   */
		var _callback = this._setCallBack(callback);
		this.__createloadMoudleQueue(componentName,_callback, ['css','html','js']);
	}else{
		//调用缓存
		this.re_mount_Moudle(getComponentFromCache,callback);
	};
};

//获得模块 (模块对应的是：html,css,js等一个或一组文件的集合)
AsyncLoading.prototype.getMoudle = function(moudle,option,callback){
	this._init(option,'getMoudle');
	var _callback = this._setCallBack(callback);
	this.__createloadMoudleQueue(moudle,_callback);
};

//初始化设置参数配置
AsyncLoading.prototype._init = function(option,type){
	var _self = this;
	var configList = [
		["mount",["isAuto","position","type"]],
		["componentRelativePath",[]]
	];
	this.resultReport = {};		//清空返回信息
	/* 设置默认值   */
	this.mount = {
		isAuto : true,
		position:1,
		type:'outside',	//outside外部引用的文件,inject外部内容直接注入进文件
	};
	this.currentComponentName = null;
	this.componentRelativePath = null;
	this.currentMoudleHTMLParentel = null;
	if(this.instanceOption != null){
		this.basePath = this.instanceOption.basePath || '';	//基础文件路径
		this.mount.isAuto = this.instanceOption.isAutoMount || true;
	};
	if(option != undefined && option != null){
		configList.forEach(function(configItem){
			if(option.hasOwnProperty(configItem[0])){
				if(configItem[1].length>0){
					configItem[1].forEach(function(configItemKey){
						if(option[configItem[0]].hasOwnProperty(configItemKey)){
							_self[configItem[0]][configItemKey] = option[configItem[0]][configItemKey];
						};
					});
				}else{
					_self[configItem[0]] = option[configItem[0]];
				}
			};
		});
	};
};

//设置回调
AsyncLoading.prototype._setCallBack = function(oldcb){
	var callback = function (data){
		this.pushMoudleCache(data);		//添加进入模块缓存
		oldcb.call(this,data);
	};
	return callback;
};

//重置挂载
AsyncLoading.prototype.re_mount_Moudle = function(data,callback){
	if(this.mount.isAuto && this.mount.type == 'inject'){
		for(var key in data){this.autoMountController(data[key])};
	};
	if(typeof callback =='function') callback(data);
};

//加载通用文件,只负责请求加载文件,实际文件处理交给回调处理   外部引用的文件,不支持缓存 和 选择挂载
AsyncLoading.prototype.__loadMoudleFromURL = function(moudleAllPath,moudleName,moudleType,success){
	var _self = this;
	this.create_mount_Moudle(moudleType,moudleName,moudleAllPath,this.mount.type,function(moudleNode){
		_self.__loadMoudleFromURLCallback(moudleNode,moudleType,moudleName,moudleAllPath,success)
	});
};

AsyncLoading.prototype.__loadMoudleFromURLCallback = function(moudleNode,moudleType,moudleName,moudleAllPath,success){
	var _self = this;
	if (this.checkbsEnv('IE') && moudleType !='css' && 'onreadystatechange' in moudleNode && !('draggable' in moudleNode)) {
        moudleNode.onreadystatechange = function (e) {
          	if (/loaded|complete/.test(moudleNode.readyState)) {
            	moudleNode.onreadystatechange = null;
            	console.log("IE")
            	_self.resultReport[moudleName+'_'+moudleType] = {
					loadMoudle:moudleName,
					type:moudleType,
					status:'OK',
					path:moudleAllPath
				};
	        	if(typeof success =='function'){
					success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
				};
          	}
        };
    }else if (moudleType =='css' && this.checkbsEnv('webKit')) {
    	// webKit下 css 没有进行加载后再执行的校验
        _self.resultReport[moudleName+'_'+moudleType] = {
			loadMoudle:moudleName,
			type:moudleType,
			path:moudleAllPath
		};
    	if(typeof success =='function'){
			success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
		};
    }else {
        moudleNode.onload =  function(){
        	_self.resultReport[moudleName+'_'+moudleType] = {
				loadMoudle:moudleName,
				type:moudleType,
				status:'OK',
				path:moudleAllPath
			};
        	if(typeof success =='function'){
				success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
			};
        };
        moudleNode.onerror =  function(){
        	_self.resultReport[moudleName+'_'+moudleType] = {
				loadMoudle:moudleName,
				type:moudleType,
				status:'Not Found',
				path:moudleAllPath
			};
        	if(typeof success =='function'){
				success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
			};
        }
    };
}

//加载通用文件,只负责请求加载文件,实际文件处理交给回调处理  外部内容直接注入进文件,支持缓存 和 选择挂载
AsyncLoading.prototype.__loadMoudle = function(moudleAllPath,moudleName,moudleType,success){
	var _self = this;
	var loadInstance = new XMLHttpRequest();
	loadInstance.onreadystatechange = function(e) {
		if(loadInstance.readyState == 4){
			var content = null;
			if(loadInstance.status == 200){
				content = loadInstance.responseText;
			};
			_self.resultReport[moudleName+'_'+moudleType] = {
				loadMoudle:moudleName,
				type:moudleType,
				status:loadInstance.statusText,
				content:content,
				path:moudleAllPath
			};
			if(typeof success =='function'){
				success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
			};
		}else if(loadInstance.readyState == 4 && loadInstance.status == 404){
			success.call(_self,_self.resultReport[moudleName+'_'+moudleType]);
		};
	};
	loadInstance.open('GET',moudleAllPath + moudleName + "."+moudleType+"?"+new Date().getTime(),true);
	loadInstance.send();
};

//生成加载模块队列
AsyncLoading.prototype.__createloadMoudleQueue = function(moudle,callback,cbfunctionList){
	this._callBackQueue = [];
	this.moudleInfo = AsyncLoading.parseMoudle(this.basePath,this.componentRelativePath,moudle);
	for(var a=0;a<this.moudleInfo.length;a++){		
		this._callBackQueue.push({
			_cbfunction:this['__loadMoudleTransformational'],
			parms:{
				moudleName:this.moudleInfo[a].name,
				moudleType:this.moudleInfo[a].ext,
				moudleAllPath:this.moudleInfo[a].allPath
			}
		});	
	};
	if(typeof callback == 'function'){
		this._callback = callback;
		this._callBackQueue.push({
			_cbfunction:this['_callback'],
			parms:this.resultReport
		});	
	};
	this.__callBackQueueRun();
};

//执行回调队列函数
AsyncLoading.prototype.__callBackQueueRun = function(){
	var callBackQueueItem = this._callBackQueue.shift();
	callBackQueueItem != undefined ? callBackQueueItem._cbfunction.call(this,callBackQueueItem.parms,this.__callBackQueueRun) : null;
};

//调用loadMoudle加载文件的回调队列执行函数
AsyncLoading.prototype.__loadMoudleTransformational = function(parms,callback){
	var _self = this;
	if(this.mount.type == 'inject'){
		this.__loadMoudle(parms.moudleAllPath,parms.moudleName,parms.moudleType, function (data){
			_self._afterloadMoudleHandler(data);
			if(typeof callback == 'function') callback.call(_self);
		});	
	}else if(this.mount.type == 'outside'){
		this.__loadMoudleFromURL(parms.moudleAllPath,parms.moudleName,parms.moudleType, function (data){
			_self._afterloadMoudleHandler(data);
			if(typeof callback == 'function') callback.call(_self);
		});	
	};
};

//调用loadMoudle加载文件后的结果进行处理的钩子函数
AsyncLoading.prototype._afterloadMoudleHandler = function(moudleInfo){
	//是否挂载
	if(this.mount.isAuto && this.mount.type == 'inject' && moudleInfo.status =='OK' && moudleInfo.content != null) this.autoMountController(moudleInfo);
	
};

//创建并挂到对应dom中
AsyncLoading.prototype.create_mount_Moudle = function(moudleType,moudleName,moudleContent,type,callback){
	var moudle = null;
	if(moudleType == 'js'){
		moudle = document.createElement("script");
		moudle.type = "text/javascript";
		moudle.toc_scriptName = moudleName;
    	moudle.toc_script = true;
    	if(type == undefined || type =='inject'){
    		moudle.append(moudleContent);
    	}else if(type == 'outside'){
    		moudle.src = moudleContent+moudleName+"."+moudleType;
    	};
		document.getElementsByTagName("body")[0].appendChild(moudle);
	}else if(moudleType == 'css'){
		if(type == undefined || type =='inject'){
    		moudle = document.createElement("style");
			moudle.type = "text/css";
			moudle.toc_styleName = moudleName;
			moudle.toc_style = true;
			moudle.append(moudleContent);
    	}else if(type == 'outside'){
    		moudle = document.createElement("link");
			moudle.rel = "stylesheet";
			moudle.toc_styleName = moudleName;
			moudle.toc_style = true;
    		moudle.href = moudleContent+moudleName+"."+moudleType;
    	};
		document.getElementsByTagName("head")[0].appendChild(moudle);
	}else if(moudleType == 'html'){
		var getCurrentMoudleHTMLParentel=document.querySelector(this.currentMoudleHTMLParentel);
		getCurrentMoudleHTMLParentel.setAttribute("toc_HtmlName",moudleName);
		getCurrentMoudleHTMLParentel.innerHTML=moudleContent;
	};
	if(typeof callback == 'function') callback(moudle);
};

//删除Moudle
AsyncLoading.prototype.remove_Moudle = function(type,moudleName){
	if(type=='js'){
		var scriptList = document.getElementsByTagName("script");
		Array.prototype.forEach.call(scriptList,function(item){
			if(item.hasOwnProperty('toc_script') ==true && toc_scriptName==undefined){
				// all remove
				document.getElementsByTagName("head")[0].removeChild(item);
			}else if(item.hasOwnProperty('toc_script') ==true && typeof toc_scriptName=='string'){
				document.getElementsByTagName("head")[0].removeChild(item);
			};
		});
	}else if(type=='css'){
		var linkList = document.getElementsByTagName("link");
		Array.prototype.forEach.call(linkList,function(item){
			if(item.hasOwnProperty('toc_style') ==true && styleName==undefined){
				// all remove
				document.getElementsByTagName("head")[0].removeChild(item);
			}else if(item.hasOwnProperty('toc_style') ==true && typeof styleName=='string'){
				document.getElementsByTagName("head")[0].removeChild(item);
			};
		});
	}else if(type=='html'){
		var getCurrentMoudleHTMLParentel=document.querySelector(this.currentMoudleHTMLParentel);
		getCurrentMoudleHTMLParentel.setAttribute("toc_HtmlName",moudleName);
		getCurrentMoudleHTMLParentel.innerHTML=moudleContent;
	};
};

//自动挂载执行函数
AsyncLoading.prototype.autoMountController = function(data){
	this.create_mount_Moudle(data.type,data.loadMoudle,data.content);
};

//添加缓存
AsyncLoading.prototype.pushMoudleCache = function(data){
	var moudleCacheLength = this.cache.moudleCacheList.length;
	if(moudleCacheLength<this.cache.moudleCacheLevel){
		this.cache.moudleCacheList.push({
			componentName:this.currentComponentName,
			data:data
		});
	}else{
		this.cache.moudleCacheList.shift();
		this.cache.moudleCacheList.push({
			componentName:this.currentComponentName,
			data:data
		});
	};
};
AsyncLoading.prototype.isHasCache = function(componentName){
	var moudleCache = this.cache.moudleCacheList;
	var returnData =null;
	for(var a=0;a<moudleCache.length;a++){
		if(moudleCache[a].componentName == componentName){
			returnData = moudleCache[a].data;
			break;
		};
	};
	return returnData;
}
AsyncLoading.prototype.checkbsEnv = function(bs){
	var bs_result = null;
	switch(bs){
		case 'IE':
  			bs_result = this.bsEnv.trident;
  		break;
		case 'webKit':
			bs_result = this.bsEnv.webKit;
		break;
	};
	return bs_result
}

AsyncLoading.parseMoudle = function(basePath,moudleRelativePath,moudle){
	var results = [];
	var moudleRelativePath = moudleRelativePath;
	var basePath = basePath;
	if(typeof moudle == 'string'){
		var moudleItem_split = moudle.split("/");
		var getmoudleExt = moudleItem_split[moudleItem_split.length-1].split(".").pop();
		var getmoudleName = moudleItem_split[moudleItem_split.length-1];
		var moudleItem_info = {
			name:getmoudleName.replace('.'+getmoudleExt, ""),
			ext:getmoudleExt,
			allPath:function(){
				moudleItem_split.pop();
				return basePath + moudleRelativePath + moudleItem_split.join("/") +"/";
			}()
		};
		results.push(moudleItem_info);
	}else if (moudle.constructor == Array && moudle.length>0){
		moudle.forEach(function (moudleItem,index){
			var moudleItem_split = moudleItem.split("/");
			var getmoudleExt = moudleItem_split[moudleItem_split.length-1].split(".").pop();
			var getmoudleName = moudleItem_split[moudleItem_split.length-1];
			var moudleItem_info = {
				name:getmoudleName.replace('.'+getmoudleExt, ""),
				ext:getmoudleExt,
				allPath:function(){
					moudleItem_split.pop();
					return basePath + moudleRelativePath + moudleItem_split.join("/") +"/";
				}()
			};
			results.push(moudleItem_info);
		});
	};
	return results;
}
