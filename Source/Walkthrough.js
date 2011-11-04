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
		prefix: 'walkthrough-',
		urlPrefix: 'walkthrough',
		startsWith: 'intro',
		currentView: null,
		storeState: true
	},

	views: {},
	current: {},

	initialize: function(viewer, content, options){
		this.viewer = document.id(viewer);
		this.setOptions(options);
		if (!this.viewer) return dbg.log('Walkthrough: Missing something...', this.viewer);

		if (content) {
			content = document.id(content).dispose();
			this.addViews(content);
		}

		var state = window.localStorage[this.options.prefix + '-state'];
		if (state) this.options.currentView = state;

		this.displayView();
	},

	displayView: function(view){
		if (!view) view = this.options.currentView || this.options.startsWith;
		if (!this.views[view]) return this.fireEvent('error', {
			type: 'navigation',
			message: 'This page does not exist',
			view: view
		});

		this.options.currentView = view;
		this._cleanView();

		this.current = new View(view, this.views[view], {
			prefix: this.options.prefix,
			urlPrefix: this.options.urlPrefix,
			onNavigation: this.bound('displayView'),
			onClose: this.bound('hide')
		});

		this.current.inject(this.viewer);

		window.localStorage[this.options.prefix + '-state'] = view;
	},

	addViews: function(els){
		var mapEl = function(el){
			el = document.id(el);
			this.views[el.get('data-' + this.options.prefix + 'id')] = el;
		};

		if (typeOf(els) === 'element') els = els.getChildren();

		new Elements(els).each(mapEl, this);
	},


	hide: function(clean){
		if (clean === true) {
			delete window.localStorage[this.options.prefix + '-state'];
			delete this.options.currentView;
		}
		this._cleanView();
	},

	_cleanView: function(){
		// Clean existing classes and elements
		if (this.current.clean) this.current.clean();

		// I realize this is probably over the top, but just in case...
		this.viewer.empty();
	}
});

var View = Walkthrough.View = new Class({

	Implements: [Options, Events, Class.Binds],

	options: {
		prefix: 'walkthrough',
		urlPrefix: 'walkthrough'
	},

	name: null,
	classes: [],

	initialize: function(name, el, options){
		this.name = name;
		this.el = document.id(el).clone(true, true);
		this.setOptions(options);
		this.el.addEvent('click:relay(a)', this.bound('_jackLinks'));
		this.closeButton = this.el.getElement('.' + this.options.prefix + 'close');
		if (this.closeButton) this.closeButton.addEvent('click', this.bound('_closeView'));
	},

	inject: function(container){
		this.el.inject(container);
	},

	clean: function(){
		this.classes.each(function(cls){
			if (cls && cls.clean) cls.clean();
		});

		if (this.el) this.el.destroy();

		delete this.el;
		delete this.classes;
		delete this.clean;
	},

	_closeView: function(e){
		if (e && e.preventDefault) e.preventDefault();
		this.fireEvent('close');
	},

	_jackLinks: function(e, el){
		var paths = Walkthrough.View.getPaths(el.get('href'));
		if (paths[0] === this.options.urlPrefix) {
			e.preventDefault();
			return this.fireEvent('navigation', paths[1]);
		}
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
