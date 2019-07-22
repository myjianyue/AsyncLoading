# AsyncLoading异步加载css,js,html,json等文件
```
var al = new AsyncLoading({
			basePath:'', 
			isAutoMount:false
		});
		al.getMoudle('formData.json',{
			relativePath:'./',
			mount:{type:'inject'}
		},function(result){
			if(result.formData_json.status == 'OK'){
      }
 	});
