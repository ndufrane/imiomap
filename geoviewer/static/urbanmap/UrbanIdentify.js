define(["dojo/_base/declare","spw/widgets/SpwAdvancedIdentify", "dojo/_base/lang", "spw/api/MessageManager",  "esri/tasks/BufferParameters", "esri/tasks/GeometryService"],
		function(declare, SpwAdvancedIdentify, lang, MessageManager, BufferParameters, GeometryService){

	return declare("imio.widget.UrbanIdentify", [SpwAdvancedIdentify], {

		iconClass: "publicSurveyIcon",

		identify: function (geom, report) {
			this._generateReport = (report === true);

			if (this._identifyResultWidget && !this._generateReport) {
				if (!this._identifyResultWidget.get('activated')) {
					this._identifyResultWidget.onActivate();
				}
			}
			//var geom = this._currentGraph.geometry;
			if (this.cbUseBuffer.get("checked")) {
				if (this.isGlobalBufferMode()) {
					this.bufferGlobal(geom, this.nsGlobalBuffer.get('value'));
				}
				else {
					this.bufferSpecific(geom);
				}
			} else {
				this.globalIdentify(geom);
			}
		},
		bufferGlobal: function (geom, buff) {
			if (buff != 0) {
				var buffParms = new BufferParameters();
				buffParms.bufferSpatialReference = this.spwViewer.get("spatialReference");
				buffParms.geometries = [geom];
				buffParms.distances = [buff];
				buffParms.unit = GeometryService.UNIT_METER;
				this.geometryService.buffer(buffParms, lang.hitch(this, function (geoms) {
					//this._resultGraph
					this._currentGraph.setGeometry(geoms[0]);
                    this.onDrawEnded(geoms[0]);
					this.globalIdentify(geoms[0]);
				}), lang.hitch(this, function (error) {
					MessageManager.getInstance().notifyError("Erreur lors de la bufferisation : " + error.toString());
					this.hideLoading();
					if (this._identifyResultWidget) {
						this._identifyResultWidget.hideLoadingImage();
					}
				}));
			}
			else {
				this.globalIdentify(geom);
			}
		}
	});
});