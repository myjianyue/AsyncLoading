# AsyncLoading
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
