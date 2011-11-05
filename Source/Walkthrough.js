/*
---

name: Walkthrough

description: A class that allows for a wizard like experience, driven by the html. Please note that Class.Binds from PowerTools is required, not MooTool More Class.Binds

license: MIT-style license.

requires: [Core/Document, Core/Element, Core/Elements, Core/Class, Class.Binds]

provides: [Walkthrough]

...
*/

(function(){

var Walkthrough = this.Walkthrough = new Class({

	Implements: [Options, Events, Class.Binds],

	options: {
		prefix: 'walkthrough',
		urlPrefix: 'walkthrough',
		startsWith: 'intro'
	},

	name: null,
	views: {},
	currentView: {},

	initialize: function(viewer, content, options){
		this.viewer = document.id(viewer);
		this.setOptions(options);
		if (!this.viewer) return;

		this.name = this.viewer.get('data-' + this.options.prefix + '-id');
		if (content) {
			content = document.id(content).dispose();
			this.addViews(content);
		}

		this.show();
	},

	show: function(view){
		// If no view specified and there's a current view inject it, otherwise use startsWith
		if (!view && this.currentView.name) {
			this.currentView.inject(this.viewer);
			return this.fireEvent('show', this.currentView.name);
		}
		else if (!view) view = this.options.startsWith;

		this._displayView(view);
		return this;
	},

	hide: function(){
		if (this.currentView.name) {
			this.currentView.dispose();
			this.fireEvent('hide', this.currentView.name);
		}
		return this;
	},

	addViews: function(els){
		var mapEl = function(el){
			el = document.id(el);
			if (typeOf(el) !== 'element') return;
			el.getElements('script').destroy();
			this.views[el.get('data-' + this.options.prefix + '-slide-id')] = el;
		};

		if (typeOf(els) === 'element') els = els.getChildren();

		new Elements(els).each(mapEl, this);
		return this;
	},

	clean: function(){
		this._cleanView();
		return this;
	},

	_displayView: function(view){
		// Validate that we have the view
		if (!this.views[view]) return this.fireEvent('error', {
			type: 'navigation',
			message: 'This page does not exist',
			view: view
		});

		this._cleanView();

		this.currentView = new View(view, this.views[view], {
			container: this.viewer,
			name: this.name,
			prefix: this.options.prefix,
			urlPrefix: this.options.urlPrefix,
			onNavigation: this.bound('_displayView'),
			onClose: this.bound('hide')
		});

		this.fireEvent('navigation', this.currentView.name);
	},

	_cleanView: function(){
		// Clean existing classes and elements
		if (this.currentView.clean) this.currentView.clean();

		// I realize this is probably over the top, but just in case...
		this.viewer.empty();
	}
});

var SlideEvents = {};

Walkthrough.extend({

	addEvent: function(keys, fn){
		keys = keys.split('.');
		var walkthrough = keys[0],
			slide = keys[1],
			event = keys[2];

		if (!SlideEvents[walkthrough]) SlideEvents[walkthrough] = {};
		if (!SlideEvents[walkthrough][slide]) SlideEvents[walkthrough][slide] = new Events();

		SlideEvents[walkthrough][slide].addEvent(event, fn);

		return Walkthrough;
	},

	removeEvent: function(keys, fn){
		keys = keys.split('.');
		var walkthrough = keys[0],
			slide = keys[1],
			event = keys[2];

		if (!SlideEvents[walkthrough] || !SlideEvents[walkthrough][slide]) return Walkthrough;

		SlideEvents[walkthrough][slide].removeEvent(event, fn);

		return Walkthrough;
	},

	fireEvent: function(keys, args){
		keys = keys.split('.');
		var walkthrough = keys[0],
			slide = keys[1],
			event = keys[2];

		if (!SlideEvents[walkthrough] || !SlideEvents[walkthrough][slide]) return Walkthrough;

		SlideEvents[walkthrough][slide].fireEvent(event, args);

		return Walkthrough;
	}

});

Walkthrough.addEvents = Walkthrough.addEvent.overloadSetter();
Walkthrough.removeEvents = Walkthrough.removeEvent.overloadSetter();
Walkthrough.addEvents = Walkthrough.fireEvent.overloadSetter();

var View = Walkthrough.View = new Class({

	Implements: [Options, Events, Class.Binds],

	options: {
		name: null,
		prefix: 'walkthrough',
		urlPrefix: 'walkthrough'
	},

	name: null,

	initialize: function(name, el, options){
		this.name = name;
		this.el = document.id(el).clone(true, true);
		this.setOptions(options);
		this.el.addEvent('click:relay(a)', this.bound('_linkHandler'));
		this.el.addEvent('click:relay([data-' + this.options.prefix + '-close])', this.bound('_closeView'));
		this.inject();
		Walkthrough.fireEvent(this._getEventKey('inject'), this.el);
	},

	inject: function(){
		this.el.inject(this.options.container);
		return this;
	},

	dispose: function(){
		Walkthrough.fireEvent(this._getEventKey('dispose'), this.el);
		this.el.dispose();
		return this;
	},

	clean: function(){
		Walkthrough.fireEvent(this._getEventKey('clean'), this.el);
		if (this.el) this.el.destroy();
		delete this.name;
		delete this.el;
		delete this.clean;
		return this;
	},

	_closeView: function(e){
		if (e && e.preventDefault) e.preventDefault();
		this.fireEvent('close');
	},

	_linkHandler: function(e, el){
		var paths = View.getPaths(el.get('href'));
		if (paths[0] === this.options.urlPrefix) {
			e.preventDefault();
			return this.fireEvent('navigation', paths[1]);
		}
	},

	_getEventKey: function(event){
		return this.options.name + '.' + this.name + '.' + event;
	}
});

View.extend({
	getPaths: function(href){
		href = href.split('/');
		href.each(function(str, i){
			if (str === '') href.splice(i, 1);
		});
		return href;
	}
});

}).call(this);
