define(["dojo/_base/declare","spw/widgets/SpwIdentifyResult", "dojo/_base/array", "dojo/_base/lang"],
		function(declare, SpwIdentifyResult, array, lang){

	return declare("imio.widget.UrbanIdentifyResult", [SpwIdentifyResult], {
		postMixInProperties: function() {
			this.inherited(arguments);
			array.forEach(this.widgets, lang.hitch(this, function(widget){
				
					require([widget.className], lang.hitch(this, function(widgetClass){
						lang.mixin(widget.config, {spwViewer: this.spwViewer});
						this._resultTableWidgetConfig = widget.config;
						this._resultTableWidgetClass = widgetClass;
					}));
				
			}));
		}
	});
});