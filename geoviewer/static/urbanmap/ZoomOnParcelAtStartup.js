/* ZoomOnParcelAtStartup */
define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/on',
    'spw/api/SpwBaseWidget',
    'esri/SpatialReference',
    'esri/graphic',"esri/Color", 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol',
    'dojo/request', 'utils/GeoJsonLayer', "spw/libs/terraformer-1.0.3.min"
], function(declare, lang, on,
            SpwBaseWidget,
            SpatialReference,
            Graphic, Color, SimpleFillSymbol, SimpleLineSymbol,
            request, GeoJsonLayer) {

    return declare(SpwBaseWidget, {

        urbanRestApiUrl : '/urbanmap',

        // Required Terrformer library reference
        _terrafomer: (typeof Terraformer !== 'undefined') ? Terraformer : null,

        _simplePolygonSym: new SimpleFillSymbol("solid",
                    new SimpleLineSymbol("solid", new Color([50, 50, 50, 0.15]), 1),
                    new Color(0,150,0,1)),

        // méthode appelée automatiquement après la création du widget
        postCreate: function() {
            this.inherited(arguments); // appelle la fonction de la classe parente

            // - this.own permet d'enregistrer l'event pour qu'il soit automatiquement supprimé
            //   à la destruction du widget.
            // - lang.hitch permet de créer une fonction avec un contexte particulier. Ainsi,
            //   le this de la fonction correspondera bien au widget

            if (typeof(urbanCapakeyArray) != "undefined"){
                lang.hitch(this, this.loadAndShowParcels(urbanCapakeyArray));
            }
            if (typeof(urbanMapWMCUrl) != "undefined")
			{
				console.warn("WMC url is not supported in this viewer");
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

        loadAndShowParcels: function(urbanCapakeyArray) {
            var urbanMapSearhCapakeyUrl = this.urbanRestApiUrl + "/" + "parcels/capakeys" + "/" + urbanCapakeyArray;
            console.debug('Search parcels :' + urbanMapSearhCapakeyUrl);
            var spwMap = this.spwViewer.get('spwMap')
            request(urbanMapSearhCapakeyUrl).then(lang.hitch(this, function(data){
                /*
                var geoJsonLayer = new GeoJsonLayer({
                    data: JSON.parse(data)
                });
                
                // Once the layer loads, set the view's extent to the layer's fullextent
                this.own(on(geoJsonLayer, 'load', lang.hitch(this,function(){
                    console.log("Geojson loaded");
                    spwMap.zoomToFeatures(geoJsonLayer.graphics)
                })));
                spwMap.esriMap.addLayer(geoJsonLayer);
                */

               var arcgisJson = this._terraformerConverter(JSON.parse(data));
               this.graphs = [];
               for (i = 0; i < arcgisJson.length; i++) {
                    var feature = arcgisJson[i];
                    // Create graphic - magically sets the geometry type!

                    var graphic = new Graphic(feature, new SimpleFillSymbol());
                    // Add to graphics
                    this.graphs.push(graphic)
                }
                this.spwViewer.get('spwMap').showFeatures(this.graphs);
                this.spwViewer.get('spwMap').zoomToFeatures(this.graphs);
              
              }), function(err){
                console.error(err);
              }, function(evt){
                // handle a progress event
            });
        },

        onDeactivate: function() {
            this.inherited(arguments);


            this.removeGraphic();
        },

        onDrawChanged: function() {
            var checked = this._drawButton.get('checked');

            // pour accéder à la carte, il est préférable d'utiliser cette fonction.
            // Si vous accédez à la map en utilisant la propriété spwMap directement, il
            // n'est pas sûr que celle-ci soit définie.
            var map = this.spwViewer.get('spwMap');

            if (checked) {
                this._handler = on(map, map.events.MapClicked, lang.hitch(this, this.onMapClicked));
            }
            else {
                this._handler && this._handler.remove();
                this._handler = null;
            }
        },

        onMapClicked: function(x, y, srid) {
            this.removeGraphic();

            // construisons le point sur base des coordonnées et de la référence spatiale
            var pt = new Point(x, y, new SpatialReference(srid));

            var symbol = new SimpleMarkerSymbol(this.symbol);

            // créons maintenant le graphique qui sera affiché sur la carte
            // avec une certaine symbologie
            this.graph = new Graphic(pt, symbol);

            // et on affiche le graphique sur la carte
            this.spwViewer.get('spwMap').showFeature(this.graph);

            this._drawButton.set('checked', false);
        },

        removeGraphic: function() {
            this.graph && this.spwViewer.get('spwMap').removeFeature(this.graph);
            this.graph = null;
        }

    });

});