define(["dojo/_base/declare","spw/widgets/SpwIdentifyResult", "dojo/text!./templates/UrbanIdentifyResult.html", "dojo/_base/array", "dojo/_base/lang", "dojo/dom-style"],
		function(declare, SpwIdentifyResult, template, array, lang, Style){

	return declare("imio.widget.UrbanIdentifyResult", [SpwIdentifyResult], {
		templateString: template,
		postMixInProperties: function() {
			this.inherited(arguments);

			array.forEach(this.widgets, lang.hitch(this, function(widget){
				
					require([widget.className], lang.hitch(this, function(widgetClass){
						lang.mixin(widget.config, {spwViewer: this.spwViewer});
						this._resultTableWidgetConfig = widget.config;
						this._resultTableWidgetClass = widgetClass;
					}));
				
			}));
		},
		postCreate: function() {
			
		}
	});
});