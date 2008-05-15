Element.implement({
	show: function() {
		if(this.hidden()) this.setStyle('display', '');
		return this;
	},
	hide: function() {
		if(!this.hidden()) this.setStyle('display', 'none');
		return this;
	},
	hidden: function() {
		return (this.getStyle('display') == 'none') ? true : false;
	}
});

window.addEvent('domready', function(){
	var duration = 0;
	var timer = 0;
	var cursorEvents = [];
	var logSize = 1000;
	var mscount;
	
	if (!nolog) {
		var mscount = (function(){ duration++; timer++; }).periodical(1);
		var wait = false;
		
		var infopos = $('info-pos');
		document.addEvents({
			'mouseenter': pushCursorEvent,
			'mouseleave': pushCursorEvent,
			'mousedown': pushCursorEvent,
			'mouseup': pushCursorEvent,
			'mousemove': function(e) {
				if(!wait) {
					wait = true;
					pushCursorEvent(e);
					(function(){ wait = false }).delay(10);
				}
			}
		});
	}
	
	function pushCursorEvent(e) {
		if(cursorEvents.length < logSize) {
			var etype='';
			switch(e.type) {
				case 'mousedown': etype='d'; break;
				case 'mouseup': etype='u'; break;
				case 'mouseover': etype='e'; break;
				case 'mouseout': etype='l'; break;
				case 'mousemove': etype='m'; break;
			}
			if(!cursorEvents.length) timer=0;
			var event = [etype, e.page.x, e.page.y, timer];
			cursorEvents.push(event);
			infopos.set('text', e.page.x+', '+e.page.y);
			timer = 0;
		}
		else {
			$clear(mscount);
			document.removeEvents();
			infopos.empty();
			storeCursorEvents();
		}
	}
	
	window.addEvent('unload', storeCursorEvents);
	
	/*
	window.addEvent('beforeunload', function(){
		storeCursorEvents();
		if(cursorEvents.length) alert('Storing your cursor activity... Thanks!');
	});
	*/
	
	function storeCursorEvents() {
		if(cursorEvents.length) {
			var jsonce = JSON.encode(cursorEvents);
			var e = new Request({ url: '/', method: 'post', onSuccess: function(){
					cursorEvents.empty();
					duration = timer = 0;
				}
			}).post({'e': jsonce, 'd': duration});
		}
	}
	
	$$('.play-link').addEvent('click', function(e){
		e = new Event(e).stop();
		var id = this.id.split('-').slice(1);
		
		var cp = new Request.JSON({ url: '/play', onComplete: function(e){
				playEvent(e, id);
			}
		}).get({'id':id});

		this.hide();
		this.getNext().show();
	});
	
	$('clear').addEvent('click', function(e){
		e = new Event(e).stop();
		$$('.cursor').each(function(el){
			if(!el.hasClass('running')) el.hide();
		});
	});
	
	function playEvent(event, id) {
		var playtimer = -1;
		var e, i=0;
		
		var cursor = $('cursor-'+id);

		if(!cursor) cursor = new Element('div', {
			'id': 'cursor-'+id,
			'class': 'cursor'
		}).inject(document.body);
		
		// running cursor?
		cursor.addClass('running').removeClass('down').show().setStyle('opacity', '1');
		
		var play = (function(){
			e = event[i];
			nexte = event[i+1];
			if(!e) {
				$clear(play);
				cursor.removeClass('running');
				var playlink = $('play-'+id);
				playlink.show();
				playlink.getNext().hide();
				return;
			}
			
			playtimer++;
			/*
				0 - event type
				1 - X position
				2 - Y position
				3 - delay
			*/
			if(playtimer == e[3]) {
				var e0 = e[0];
				if (i==0) {
					cursor.setStyles({
						'top': e[2],
						'left': e[1]
					});
				} else {
					if(nexte) cursor.set('morph', {
						'duration': nexte[3],
						onComplete: function() {
							switch(e0) {
								case 'd': cursor.addClass('down'); break;
								case 'u': cursor.removeClass('down'); break;
								case 'l': cursor.setStyle('opacity','.3'); break;
								case 'm': cursor.setStyle('opacity','1'); break;
							}
						}.bind(e0)
					});
					if(e0=='e') cursor.setStyle('opacity','1');
					cursor.morph({
						'top': e[2],
						'left': e[1]
					});
				}
				
				playtimer=-1;
				i++;
			}
		}).periodical(1);
	}
});