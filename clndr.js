$(document).ready(function() {

	$.ajaxSetup({async:false});
	/*
	* Global variables
	*/
    var apiBaseUrl = 'http://localhost:8085/openmrs-dev/ws/rest/v1';
	var credentials = 'Basic ' + btoa('admin', 'Admin123');
    $.getJSON("manifest.webapp", function( json ) {
        apiBaseUrl = json.activities.openmrs.href + "/ws/rest/v1";
		console.log(apiBaseUrl+'/appointmentscheduling/appointmentblockwithtimeslot');
    });
	var appointmentBlockUrl = apiBaseUrl + "/appointmentscheduling/appointmentblockwithtimeslot";
	var appointmentTypesUrl = apiBaseUrl + "/appointmentscheduling/appointmenttype";
	var paymentTypesUrl = apiBaseUrl + "/appointmentscheduling/paymenttype";
	var providersUrl = apiBaseUrl + "/provider";
	var locationsUrl = apiBaseUrl + "/location";
	
	var additionalProviderCashe = [];
	
	var highlightSkeleton = '<div class="fc-highlight-skeleton"><table><tbody><tr>';
	var isWorkDays = false;
	var isWeekend = false;
	
	/*
	***********************************************************************
	**************Appointment Block objects and sources********************
	***********************************************************************
	*/
	var AppointmentBlock = function(obj){
		
		var serviceDuration;
		
		this.construct = function(obj){
			this.uuid = obj.uuid;
			this.types = obj.types;
			this.title = this.getTitleFromTime(obj.startDate, obj.endDate);
			this.start = obj.startDate;
			this.end = obj.endDate;
			this.location = obj.location;
			this.provider = obj.provider;
			this.serviceDuration = obj.serviceDuration;
			this.nursesQuantity = obj.nursesQuantity;
			this.additionalProviders = obj.additionalProviders;
			this.paymentTypes = obj.paymentTypes;
		}
		
		Object.defineProperty(this, "serviceDuration", {
			get: function() {
				if(!serviceDuration){
					serviceDuration = 5;
				}
				return serviceDuration;
			},
			set: function(newValue) {
				serviceDuration = newValue;
			},

			enumerable: true,
			configurable: true
		});

		
		this.getTitleFromTypes = function(appointmentTypes){
			var types = $.map(appointmentTypes,function(v,k){
				return v.display;
			});
			return types.join(',');
		}
		
		this.getTitleFromTime = function(start, end){
			var st = new Date(start);
			var en = new Date(end);
			return st.toLocaleTimeString('ru-RU',{ hour12: false }) + '-' + en.toLocaleTimeString('ru-RU',{ hour12: false });
		}
		
		this.construct(obj);
	}
	
	var AppointmentBlockSource = function(appointmentBlocks, id){
		
		this.construct = function(id, appointmentBlocks){
			this.id = id;
			this.events = appointmentBlocks;
		}
		this.construct(id, appointmentBlocks);
	}
	
	var appointmentBlockSource = new AppointmentBlockSource('appointmentBlocks');
	appointmentBlockSource.events = function(start, end, timezone, callback) {
		var locationUuid = $('#location').find('option:selected').val();
		var providerUuid = $('#provider').find('option:selected').val();
		if(!locationUuid || !providerUuid){
			callback([]);
		}else{
			var url;
			if(providerUuid == 'all'){
				url = appointmentBlockUrl+'?v=default&location='+locationUuid;
			}else{
				url = appointmentBlockUrl+'?v=default&location='+locationUuid+'&provider='+providerUuid;
			}
			$.ajax({
				url: url,
				method: 'GET',
				headers: {
					"authorization": credentials,
					"content-type": "application/json"
				},
				success: function(response){
					var data = response.results;
					var events = [];
					$.each(data,function(key,value){
						events.push(
							new AppointmentBlock(value)
						);
					});
					callback(events);
				}
			});
		}
	}
	/*
	***************END*****END*****END*****END*****END*********************
	***************END*****END*****END*****END*****END*********************
	***************END*****END*****END*****END*****END*********************
	*/
	
	/*
	* flashMessage function
	* shows div in fixed position with a message
	*/
	flashMessage = function(status, message){
		var flashMessage = $('<div class="alert alert-' + status + '" role="alert" style="position:fixed;top:5px;right:5px;display:none;">' + message + '</div>');
		$(flashMessage).appendTo('body');
		$(flashMessage).fadeIn("slow", function() {
		});
		setTimeout(function () {
			$(flashMessage).fadeOut("slow", function() {
				$(this).remove();
			});
		}, 3000);
	}
	
	//retrieves all locations from the API and puts its data to <select>
	$.ajax({
		url: locationsUrl,
		method: 'GET',
		headers: {
			"authorization": credentials,
			"content-type": "application/json"
		},
		success: function(response){
			var data = response.results;
			var options = '<option value="">' + 'Choose a location' + '</option>';
			$.each(data,function(key,value){
				options += '<option value="' + value.uuid + '">' + value.display + '</option>';
			});
			$('#location').html(options);
		}
	});
	
	//when selecting a location retrieves all providers for the selected location from the API and puts its data to <select>
	$('#location').change(function(e){
		$.ajax({
			url: providersUrl,
			method: 'GET',
			headers: {
				"authorization": credentials,
				"content-type": "application/json"
			},
			success: function(response){
				var data = response.results;
				var options = '<option value="">' + 'Choose a provider' + '</option><option value="all">' + 'All providers' + '</option>';
				$.each(data,function(key,value){
					options += '<option value="' + value.uuid + '">' + value.display.split("-")[1] + '</option>';
				});
				$('#provider').html(options);
				$('#calendar').fullCalendar('refetchEvents');
			}
		});
	});
	
	//when selecting a provider refetches all the appointments from the API for the selected provider
	$('#provider').change(function(e){
		var locationUuid = $('#location').find('option:selected').val();
		var providerUuid = $('#provider').find('option:selected').val();
		
		if(!locationUuid || !providerUuid){
			$('#calendar').fullCalendar('removeEventSources');
		}else{
			$('#calendar').fullCalendar('refetchEvents');
		}
	});
	
	//retrieves all appointment types from the API and puts its data to <select>
	$.ajax({
		url: appointmentTypesUrl,
		method: 'GET',
		headers: {
			"authorization": credentials,
			"content-type": "application/json"
		},
		success: function(response){
			var data = response.results;
			var options = '<option value="">' + 'Choose services' + '</option>';
			$.each(data,function(key,value){
				options += '<option value="' + value.uuid + '">' + value.display + '</option>';
			});
			$('#appointmentType').html(options);
		}
	});
	
	//retrieves all payment types from the API and puts its data to <select>
	$.ajax({
		url: paymentTypesUrl,
		method: 'GET',
		headers: {
			"authorization": credentials,
			"content-type": "application/json"
		},
		success: function(response){
			var data = response.results;
			$.each(data,function(i,v){
				$('#paymentTypeList').append('<label class="checkbox-inline"><input type="checkbox" class="listItem" value="' + v.uuid + '">' + v.display + '</label>');
			});
		}
	});
	
	$('body').on('click','.removeAppointmentType',function(){
		$(this).closest('tr').remove();
	});
	$('#appointmentType').change(function(e){
		var appointmentTypeUuid = $(this).find('option:selected').val();
		var appointmentTypeText = $(this).find('option:selected').text();
		var appointmentTypeList = $('#appointmentTypeList');
		appointmentTypeList.append('<tr><td><span class="listItem" data-uuid="' + appointmentTypeUuid + '">' + appointmentTypeText + '</span></td>'
		+'<td><span class="glyphicon glyphicon-minus pull-right removeAppointmentType" aria-hidden="true"></span></td>'
		+'</tr>');
	});
	
	//serviceDuration event handlers
	$('#serviceDuration').val(5);
	$('#serviceDuration').keydown(function(e){
		if(((e.which >= 32 && e.which <= 47) || (e.which >= 58 && e.which <= 127)) && ($.inArray(e.which,[37,38,39,40]) < 0)){
			e.preventDefault();
		}
	});
	$('#serviceDuration').blur(function(e){
		if(!$(this).val()){
			$(this).val(5);
		}
	});
	
	//nursesQuantity event handlers
	$('#nursesQuantity').val(0);
	$('#nursesQuantity').keydown(function(e){
		if(((e.which >= 32 && e.which <= 47) || (e.which >= 58 && e.which <= 127)) && ($.inArray(e.which,[37,38,39,40]) < 0)){
			e.preventDefault();
		}
	});
	$('#nursesQuantity').blur(function(e){
		if(!$(this).val()){
			$(this).val(0);
		}
	});
	
	//when a page is loading first time we hide an update button
	$('#update').addClass('hidden');
	//appointmentContainer buttons event handlers
	$('#apply').click(function(e){
		applySchedule(e)
	});
	$('#update').click(function(e){
		updateSchedule(e, $('#appointmentContainer').data('uuid'))
	});
	$('#delete').click(function(e){
		deleteSchedule(e, $('#appointmentContainer').data('uuid'))
	});
	
	/*
	*******************Initializing dialog window*************************************
	*/
    $( "#providersDialog" ).dialog({
		autoOpen: false,
		title: 'Provider schedule',
		width: 'auto',
		show: {
			effect: "blind",
			duration: 1000
		},
		hide: {
			effect: "explode",
			duration: 1000
		}
    });
	$('#selectProviders').click(function(e){
		$( "#providersDialog" ).dialog('open');
	});
	var makeTree = function(array){
		var treeArr = [];
		var filter = function(array){
			var newArr = [];
			$.each(array,function(i,v){
				var newObj = {};
				newObj.uuid = v.uuid;
				newObj.text = v.display;
				newObj.parentLocation = v.parentLocation;
				if(v.childLocations != null){
					newObj.nodes = filter(v.childLocations);
				}
				newArr.push(newObj);
			});
			return newArr;
		}
		
		array = filter(array);
		
		treeArr = $.grep(array,function(v,i){
			return v.parentLocation == null;
		});
		return treeArr;
	}
	$.ajax({
		url: locationsUrl+'?v=full',
		method: 'GET',
		headers: {
			"authorization": credentials,
			"content-type": "application/json"
		},
		success: function(response){
			var data = response.results;
			var tree = makeTree(data);
			$('#locationTree').treeview({
				data: tree,
				expandIcon: 'glyphicon glyphicon-plus',
				collapseIcon: 'glyphicon glyphicon-minus',
				emptyIcon: 'glyphicon',
				nodeIcon: '',
				checkedIcon: 'glyphicon glyphicon-check',
				uncheckedIcon: 'glyphicon glyphicon-unchecked'
			});
			$('#locationTree').treeview('expandAll', { silent: true });
			$('#locationTree').on('nodeSelected', function(event, data) {
				$.ajax({
					url: providersUrl,
					method: 'GET',
					headers: {
						"authorization": credentials,
						"content-type": "application/json"
					},
					success: function(response){
						var data = response.results;
						$('#additionalProvider').html('');
						$.each(data,function(key,value){
							$('#additionalProvider').append('<p class="selectable" data-uuid="' + value.uuid + '">' + value.display.split("-")[1] + '</p>');
						});
						
					}
				});
			});
		}
	});
	$('body').on('click','.removeAdditionalProvider',function(){
		var indexToRemove = additionalProviderCashe.indexOf($(this).closest('tr').find('span.listItem').first().data('uuid'));
		additionalProviderCashe.splice(indexToRemove,1);
		$(this).closest('tr').remove();
	});
	$('body').on('click','#additionalProvider .selectable',function(i){
		var additionalProviderUuid = $(this).data('uuid');
		var additionalProviderText = $(this).text();
		if($.inArray(additionalProviderUuid, additionalProviderCashe) >= 0){
			return null;
		}
		additionalProviderCashe.push(additionalProviderUuid);
		var additionalProviderList = $('#additionalProviderList');
		additionalProviderList.append('<tr><td><span class="listItem" data-uuid="' + additionalProviderUuid + '">' + additionalProviderText + '</span></td>'
		+'<td><span class="glyphicon glyphicon-minus pull-right removeAdditionalProvider" aria-hidden="true"></span></td>'
		+'</tr>');
	});
	/*
	**********************************************************************************
	*/
	
	/*
	* Initializing datepickers and timepickers
	*/
    $('#startDate').datepicker({dateFormat: "yy-mm-dd"});
    $('#startTime').timepicker({ 'step': 5,'timeFormat': 'H:i:s', 'minTime': '8:00:00', 'maxTime': '20:00:00' });
    $('#endTime').timepicker({ 'step': 5,'timeFormat': 'H:i:s', 'minTime': '8:00:00', 'maxTime': '20:00:00' });
    $('#endDate').datepicker({dateFormat: "yy-mm-dd"});
    $('#startBreakTime').timepicker({ 'step': 5,'timeFormat': 'H:i:s', 'minTime': '8:00:00', 'maxTime': '20:00:00' });
    $('#endBreakTime').timepicker({ 'step': 5,'timeFormat': 'H:i:s', 'minTime': '8:00:00', 'maxTime': '20:00:00' });
	/*
	**********************************************************************
	*/
    
	/*
	* Break time event handlers
	*/
	$('#addBreak').click(function(e){
		var startBreak = $('#startBreakTime').val();
		var endBreak = $('#endBreakTime').val();
		var breakTimeList = $('#breakTimeList');
		breakTimeList.append('<tr><td><span class="listItem">' + startBreak + ' - ' + endBreak + '</span></td>'
		+'<td><span class="glyphicon glyphicon-minus pull-right removeBreak" aria-hidden="true"></span></td>'
		+'</tr>');
	});
	$('body').on('click','.removeBreak',function(){
		$(this).closest('tr').remove();
	});
	
	/*
	* Creates new appointment schedule with the values in the dialog window
	*/
    applySchedule = function(e){
		console.log('applying');
        e.preventDefault();
        var endDate = new Date($('#endDate').val());
        var startDate = new Date($('#startDate').val());
        var timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
		
		var locationUuid = $('#location').find('option:selected').val();
		var providerUuid = $('#provider').find('option:selected').val();
		
		var appointmentTypes = [];
		$('#appointmentTypeList').find('span.listItem').each(function(index){
			appointmentTypes.push($(this).data('uuid'));
		});
		
		var days = [];
		var startMoment = moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate());
		var endMoment = moment(endDate.getFullYear() + '-' + (endDate.getMonth()+1) + '-' + endDate.getDate()).add(1,'day');
		var dayCounter = 0;
		if(!(startMoment.format() == endMoment.add(-1,'day').format()) && startMoment.isoWeekday() == 7){
			if(isWorkDays){
				while(startMoment.format() != endMoment.format()){
					if(startMoment.isoWeekday() == 6 || startMoment.isoWeekday() == 7){
						dayCounter++;
					}else{
						days.push(dayCounter);
						dayCounter = 0;
					}
					startMoment.add(1,'day');
				}
			} else{
				while(startMoment.format() != endMoment.format()){
					if(startMoment.isoWeekday() != 6){
						dayCounter++;
					}else{
						days.push(dayCounter);
						dayCounter = 0;
					}
					startMoment.add(1,'day');
				}
			}
		} else{
			flashMessage('warning','Sunday is not a work day');
		}
		
		var breakTimes = [];
		$('#breakTimeList').find('span.listItem').each(function(index){
			$.each($(this).text().split('-'),function(i,v){
				breakTimes.push(v.trim());
			});
		});
		breakTimes.sort();
		var startTime = [];
		var endTime = [];
		if(!breakTimes.length){
			startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#startTime').val()));
			endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#endTime').val()));
		} else{
			for(i=0; i <= breakTimes.length; i++){
				if(i%2 == 0){
					if(i==0){
						startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#startTime').val()));
						endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
					}
					continue;
				}
				if(i == (breakTimes.length-1)){
					startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
					endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#endTime').val()));
					continue;
				}
				startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
				endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i+1]));
			}
		}
		
		var serviceDuration = $('#serviceDuration').val();
		var nursesQuantity = $('#nursesQuantity').val();
		var additionalProviders = [];
		$('#additionalProviderList').find('span.listItem').each(function(index){
			additionalProviders.push($(this).data('uuid'));
		});
		
		var paymentTypes = [];
		$('#paymentTypeList').find('.listItem:checked').each(function(index){
			paymentTypes.push($(this).val());
		});
		
		var appointmentBlock;
		$.each(days,function(i,v){
			$.each(startTime, function(index,value){
				startTime[index].add(v,'day');
				endTime[index].add(v,'day');
				appointmentBlock = {
					'types':appointmentTypes,
					'startDate': startTime[index].clone().format(),
					'endDate': endTime[index].clone().format(),
					'location': {
						'uuid': locationUuid
					},
					'provider': {
						'uuid': providerUuid
					},
					'serviceDuration': serviceDuration.toString(),
					'nursesQuantity': nursesQuantity.toString(),
					'additionalProviders':additionalProviders,
					'paymentTypes': paymentTypes
				};
				$.ajax({
					url: appointmentBlockUrl,
					method: 'POST',
					data: JSON.stringify(appointmentBlock),
					headers: {
						"authorization": credentials,
						"content-type": "application/json"
					},
					success: function(response){
						console.log('apply request '+i+' '+index);
						flashMessage('success','Appoinment schedule was successfully created');
					}
				}).fail(function(e) {
					console.log('apply error '+i+' '+index);
					flashMessage('error',e);
				});
				startTime[index].add(1,'day');
				endTime[index].add(1,'day');
			});
		});
		console.log('apply refetching');
        $('#calendar').fullCalendar('refetchEvents');
        $('#calendar').fullCalendar('unselect');
    }
	
	/*
	* Updates an existing appointment schedule with the values in the dialog window
	* @param e Event
	* @param uuid uuid property of AppoinmentBlock object
	*/
	updateSchedule = function(e, uuid){
		console.log('updating');
        e.preventDefault();
		var uuid = uuid;
        var endDate = new Date($('#endDate').val());
        var startDate = new Date($('#startDate').val());
        var timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
		
		var locationUuid = $('#location').find('option:selected').val();
		var providerUuid = $('#provider').find('option:selected').val();
		
		var appointmentTypes = [];
		$('#appointmentTypeList').find('span.listItem').each(function(index){
			appointmentTypes.push($(this).data('uuid'));
		});
		
		var breakTimes = [];
		$('#breakTimeList').find('span.listItem').each(function(index){
			$.each($(this).text().split('-'),function(i,v){
				breakTimes.push(v.trim());
			});
		});
		breakTimes.sort();
		var startTime = [];
		var endTime = [];
		if(!breakTimes.length){
			startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#startTime').val()));
			endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#endTime').val()));
		} else{
			for(i=0; i <= breakTimes.length; i++){
				if(i%2 == 0){
					if(i==0){
						startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#startTime').val()));
						endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
					}
					continue;
				}
				if(i == (breakTimes.length-1)){
					startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
					endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + $('#endTime').val()));
					continue;
				}
				startTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i]));
				endTime.push(moment(startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate() + ' ' + breakTimes[i+1]));
			}
		}
		
		var serviceDuration = $('#serviceDuration').val();
		var nursesQuantity = $('#nursesQuantity').val();
		var additionalProviders = [];
		$('#additionalProviderList').find('span.listItem').each(function(index){
			additionalProviders.push($(this).data('uuid'));
		});
		
		var paymentTypes = [];
		$('#paymentTypeList').find('.listItem:checked').each(function(index){
			paymentTypes.push($(this).val());
		});
		
		$.ajax({
			url: appointmentBlockUrl+'/'+uuid,
			method: 'DELETE',
			headers: {
				"authorization": credentials,
				"content-type": "application/json"
			},
			success: function(response){
				console.log('deleted');
				var appointmentBlock;
				for(i=0; i<= diffDays; i++){
					$.each(startTime, function(index,value){
						appointmentBlock = {
							'types':appointmentTypes,
							'startDate': startTime[index].clone().format(),
							'endDate': endTime[index].clone().format(),
							'location': {
								'uuid': locationUuid
							},
							'provider': {
								'uuid': providerUuid
							},
							'serviceDuration': serviceDuration.toString(),
							'nursesQuantity': nursesQuantity.toString(),
							'additionalProviders':additionalProviders,
							'paymentTypes': paymentTypes
						};
						$.ajax({
							url: appointmentBlockUrl,
							method: 'POST',
							data: JSON.stringify(appointmentBlock),
							headers: {
								"authorization": credentials,
								"content-type": "application/json"
							},
							success: function(response){
								console.log('update request '+i+' '+index);
								flashMessage('success','Appoinment schedule was successfully updated');
							}
						}).fail(function(e) {
							console.log('update error '+i+' '+index);
							flashMessage('error',e);
						});
						startTime[index].add(1,'day');
						endTime[index].add(1,'day');
					});
				}
			}
		}).fail(function(e) {
			flashMessage('error',e);
		});
		console.log('update refetching');
        $('#calendar').fullCalendar('refetchEvents');
        $('#calendar').fullCalendar('unselect');
    }
	
	/*
	* Deletes an existing appointment schedule
	* @param e Event
	* @param uuid uuid property of AppoinmentBlock object
	*/
	deleteSchedule = function(e, uuid){
		e.preventDefault();
		var uuid = uuid;
		$.ajax({
			url: appointmentBlockUrl+'/'+uuid,
			method: 'DELETE',
			headers: {
				"authorization": credentials,
				"content-type": "application/json"
			},
			success: function(response){
				flashMessage('success','Appoinment schedule was successfully deleted');
			}
		}).fail(function(e) {
			flashMessage('error',e);
		});
		$('#calendar').fullCalendar('refetchEvents');
	}
    
	/*
	* Initializing calendar with the jquery fullcalendar plugin
	*/
    $('#calendar').fullCalendar({
        defaultView: 'agenda',
		locale: 'ru',
        allDaySlot:false,
		minTime: "08:00:00",
		maxTime: "20:00:00",
        slotDuration: '00:10:00',
        header: {
            left: 'prev,next today myCustomButton',
            center: 'title',
            right: 'month,agendaWeek,agendaDay,listWeek'
        },
		businessHours: {
			dow: [ 1, 2, 3, 4, 5, 6 ],
			start: '8:00',
			end: '20:00',
		},
        themeSystem:'bootstrap3',
        navLinks:true,
		defaultTimedEventDuration: '02:00:00',
		defaultAllDayEventDuration: { days: 1 },
		forceEventDuration:true,
        editable:true,
        eventStartEditable:true,
        eventLimit:3,
		eventSources: [
			appointmentBlockSource
		],
		eventConstraint: "businessHours",
		//selectConstraint: "businessHours",
		eventClick: function(calEvent, jsEvent, view) {
			var appointmentTypeList = $('#appointmentTypeList');
			appointmentTypeList.html('');
			$.each(calEvent.types, function(index,value){
				appointmentTypeList.append('<tr><td><span class="listItem" data-uuid="' + value.uuid + '">' + value.display + '</span></td>'
					+'<td><span class="glyphicon glyphicon-minus pull-right removeAppointmentType" aria-hidden="true"></span></td>'
					+'</tr>');
			});
			$('#breakTimeList').html('');
			$('#startDate').val(calEvent.start.format('YYYY-MM-DD'));
			$('#startTime').val(calEvent.start.format('HH:mm:ss'));
			$('#endDate').val(calEvent.end.format('YYYY-MM-DD'));
			$('#endTime').val(calEvent.end.format('HH:mm:ss'));
			$('#serviceDuration').val(calEvent.serviceDuration);
			$('#nursesQuantity').val(calEvent.nursesQuantity);
			
			var additionalProviderList = $('#additionalProviderList');
			additionalProviderList.html('');
			additionalProviderCashe = [];
			$.each(calEvent.additionalProviders, function(index,value){
				additionalProviderCashe.push(value.uuid);
				additionalProviderList.append('<tr><td><span class="listItem" data-uuid="' + value.uuid + '">' + value.display.split("-")[1] + '</span></td>'
					+'<td><span class="glyphicon glyphicon-minus pull-right removeAdditionalProvider" aria-hidden="true"></span></td>'
					+'</tr>');
			});
			
			var paymentTypes = [];
			$.each(calEvent.paymentTypes, function(index,value){
				paymentTypes.push(value.uuid);
			});
			$('#paymentTypeList').find('.listItem').each(function(index){
				if($.inArray($(this).val(),paymentTypes) >= 0){
					$(this).attr('checked',true);
				}else{
					$(this).attr('checked',false);
				}
			});
			
			$('#apply').addClass('hidden');
			$('#update').removeClass('hidden');
			$('#appointmentContainer').data('uuid',calEvent.uuid);
		},
        selectable: true,
        selectHelper: true,
		unselectAuto: false,
        select: function(start, end, jsEvent, view, resorce) {
			if($('#workDays').is(':checked')){
				selectWorkDays();
			} else if($('#weekend').is(':checked')){
				selectWeekend();
			} else{
				unselectWeekend();
			}
			if(view.name == 'month'){
				$('#startDate').val(start.format());
				$('#endDate').val(end.add(-1,'day').format());
			}
			if(view.name == 'agendaWeek'){
				var startTime = start.format().split('T');
				var endTime = end.format().split('T');
				$('#startDate').val(startTime[0]);
				$('#endDate').val(endTime[0]);
				$('#startTime').val(startTime[1]);
				$('#endTime').val(endTime[1]);
			}
			if(view.name == 'agendaDay'){
				var startTime = start.format().split('T');
				var endTime = end.format().split('T');
				$('#startDate').val(startTime[0]);
				$('#endDate').val(endTime[0]);
				$('#startTime').val(startTime[1]);
				$('#endTime').val(endTime[1]);
			}
			$('#update').addClass('hidden');
			$('#apply').removeClass('hidden');
			$('#appointmentContainer').data('uuid',null);
        },
		eventResize: function( event, delta, revertFunc, jsEvent, ui, view ) {
			updateAppointmentBlock(event);
		},
		eventDrop: function( event, delta, revertFunc, jsEvent, ui, view ) {
			updateAppointmentBlock(event);
		}
    });
	
	$('#workDays').change(function(e){
		if($(this).is(':checked')){
			isWorkDays = true;
			selectWorkDays();
		}
	});
	
	$('#weekend').change(function(e){
		if($(this).is(':checked')){
			isWorkDays = false;
			selectWeekend();
		}
	});
	
	unselectWeekend = function(){
		$('.fc-highlight').each(function(i){
			var colspan = $(this).attr('colspan');
			var prev = $(this).prev();
			var next = $(this).next();
			var dowCount = 7;
			var availableDowCount = 6;
			var leftDays = availableDowCount;
			if($(prev).length > 0){
				leftDays = availableDowCount - $(prev).attr('colspan');
			}
			if(leftDays <= 0){
				$(this).closest('.fc-highlight-skeleton').remove();
			} else{
				if(colspan > leftDays){
					$(this).attr('colspan',leftDays);
					if($(next).length > 0){
						$(next).attr('colspan',dowCount - availableDowCount);
					} else{
						var td = document.createElement('td');
						$(td).attr('colspan',dowCount - availableDowCount);
						$(this).after(td);
					}
				}
			}
		});
	}
	
	selectWorkDays = function(){
		$('.fc-highlight').each(function(i){
			var colspan = $(this).attr('colspan');
			var prev = $(this).prev();
			var next = $(this).next();
			var dowCount = 7;
			var availableDowCount = 5;
			var leftDays = availableDowCount;
			if($(prev).length > 0){
				leftDays = availableDowCount - $(prev).attr('colspan');
			}
			if(leftDays <= 0){
				$(this).closest('.fc-highlight-skeleton').remove();
			} else{
				if(colspan > leftDays){
					$(this).attr('colspan',leftDays);
					if($(next).length > 0){
						$(next).attr('colspan',dowCount - availableDowCount);
					} else{
						var td = document.createElement('td');
						$(td).attr('colspan',dowCount - availableDowCount);
						$(this).after(td);
					}
				}
			}
		});
	}
	
	selectWeekend = function(){
		$('.fc-highlight').each(function(i){
			var colspan = $(this).attr('colspan');
			var prev = $(this).prev();
			var next = $(this).next();
			var dowCount = 7;
			var availableWeekendCount = 1;
			var availableDowCount = 5;
			var leftDays = availableDowCount;
			if($(prev).length > 0){
				leftDays = availableDowCount - $(prev).attr('colspan');
			}
			if(leftDays < 0){
				$(this).closest('.fc-highlight-skeleton').remove();
			} else if(colspan > leftDays){
				$(this).attr('colspan',availableWeekendCount);
				
				if($(prev).length > 0){
					$(prev).attr('colspan', 5);
				} else{
					var td = document.createElement('td');
					$(td).attr('colspan',5);
					$(this).before(td);
				}
				
				if($(next).length > 0){
					$(next).attr('colspan',1);
				} else{
					var td = document.createElement('td');
					$(td).attr('colspan',1);
					$(this).after(td);
				}
			} else{
				$(this).closest('.fc-highlight-skeleton').remove();
			}
		});
	}
	
	/*
	* Updates an existing appointment schedule
	* @param appointmentBlock AppoinmentBlock object that have to be updated
	*/
	updateAppointmentBlock = function(appointmentBlock){
		var objToSave = {
			'types':appointmentBlock.types,
			'startDate': appointmentBlock.start.format(),
			'endDate': appointmentBlock.end.format(),
			'location': {
				'uuid': appointmentBlock.location.uuid
			},
			'provider': {
				'uuid': appointmentBlock.provider.uuid
			},
			'serviceDuration': appointmentBlock.serviceDuration,
			'nursesQuantity': appointmentBlock.nursesQuantity,
			'additionalProviders':appointmentBlock.additionalProviders,
			'paymentTypes': appointmentBlock.paymentTypes
		}
		$.ajax({
			url: appointmentBlockUrl+'/'+appointmentBlock.uuid,
			method: 'DELETE',
			headers: {
				"authorization": credentials,
				"content-type": "application/json"
			},
			success: function(response){
				$.ajax({
					url: appointmentBlockUrl,
					method: 'POST',
					data: JSON.stringify(objToSave),
					headers: {
						"authorization": credentials,
						"content-type": "application/json"
					},
					success: function(response){
						flashMessage('success','Appointment schedule was successfully created');
					}
				}).fail(function() {
					console.log('error');
				});
			}
		}).fail(function() {
			console.log('error');
		});
		$('#calendar').fullCalendar('refetchEvents');
	}
});