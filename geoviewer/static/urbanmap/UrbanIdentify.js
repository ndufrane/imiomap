define(["dojo/_base/declare", 'dojo/on', 'dojo/request', "esri/geometry/geometryEngine", "esri/geometry/Polygon",
	"spw/widgets/SpwAdvancedIdentify",
	'esri/graphic', 'esri/symbols/SimpleMarkerSymbol',
	"dojo/_base/lang",
	"spw/api/MessageManager",
	"esri/tasks/BufferParameters",
	"esri/tasks/GeometryService", 'esri/SpatialReference', "spw/libs/terraformer-1.0.3.min"],
		function(declare, on, request, geometryEngine, Polygon, SpwAdvancedIdentify, Graphic, SimpleMarkerSymbol, lang, MessageManager, BufferParameters, GeometryService, SpatialReference){

	return declare("imio.widget.UrbanIdentify", [SpwAdvancedIdentify], {

		iconClass: "publicSurveyIcon",
		_copyparcelHandler: null,
        urbanUrl: "parcelsinfo",
		urbanRestApiUrl : '/urbanmap',
        // Required Terrformer library reference
		_terrafomer: (typeof Terraformer !== 'undefined') ? Terraformer : null,
		_inSpatialReference : new SpatialReference({wkid: 31370}),
		isFirstAfterActivation: true,

		symbol: {
            color: [255, 255, 255, 64],
            size: 12,
            type: 'esriSMS',
            style: 'esriSMSCircle',
            outline: {
                color: [0, 0, 0, 255],
                width: 1,
                type: 'esriSLS',
                style: 'esriSLSSolid'
            }
		},
		
		onClickBtPoint: function () {
			if (this._disableEvent) {
				if(!this.btPoint.get("checked")) {

					this.onCopyParcelDeactivate();
				}
				this._disableEvent = false;
				return;
			}
			if (this.btPoint.get("checked")) {
				this.disableCurrentBt();
				this.onCopyParcelActivate();

				this._currentGraph = this._polygoneGraph;
				this.isFirstAfterActivation = true;
				this._currentBt = this.btPoint;		
			}
			else {
				this.onCopyParcelDeactivate();
				this.disableCurrentBt();
			}
		},

		_terraformerConverter: function (geojson) {
            var json,
                arcgis;
            // Convert the geojson object to a Primitive json representation
            json = new this._terrafomer.Primitive(geojson);
            // Convert to ArcGIS JSON
            arcgis = this._terrafomer.ArcGIS.convert(json);
            return arcgis;
		},
		
        onCopyParcelActivate: function() {          
            var map = this.spwViewer.get('spwMap');
            this._copyparcelHandler = on(map, map.events.MapClicked, lang.hitch(this, this.onMapClicked));
        },

        onCopyParcelDeactivate: function() {         
            this._copyparcelHandler && this._copyparcelHandler.remove();
            this._copyparcelHandler = null;
		},

		onMapClicked: function(x, y, srid) {
           
            var urbanMapSearhCapakeyUrl = this.urbanRestApiUrl + "/" + "parcels/spatial_search";
			var wktPoint = "POINT("+ x + " " + y + ")";
			var symbol = new SimpleMarkerSymbol(this.symbol);

            request(urbanMapSearhCapakeyUrl ,{
                'Content-Type': 'application/x-www-form-urlencoded',
                'method' : 'POST',
                'data' : {
                    'geom' : wktPoint
                },
                handleAs: "json"
            }).then(lang.hitch(this, function(data){
				var esriJson = this._terraformerConverter(data);
				
				var unionedFeature = this._currentGraph.geometry;
				var enableBtn = false;
				for (i = 0; i < esriJson.length; i++) {
					var feature = esriJson[i];
					var graphic = new Graphic(feature, symbol);
					graphic.geometry.setSpatialReference(this._inSpatialReference);
					feature = graphic.geometry;
					if(this.isFirstAfterActivation){
						unionedFeature = feature;
						this.isFirstAfterActivation = false;
					} else {
						unionedFeature = geometryEngine.union([unionedFeature, feature]);
					}
	
					enableBtn = true;
				}
				
				this._currentGraph.setGeometry(unionedFeature);
				this._currentGraph.show();
				if(enableBtn) {
					this.btIdentify.set("disabled", false);
				}
            }));
		},
			
		identify: function (geom, report) {
			this._generateReport = (report === true);

			if (this._identifyResultWidget && !this._generateReport) {
				if (!this._identifyResultWidget.get('activated')) {
					this._identifyResultWidget.onActivate();
				}
			}

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