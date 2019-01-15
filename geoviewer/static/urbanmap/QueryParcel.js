/* QueryParcel */
define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/on',
    'dojo/text!./templates/QueryParcel.html', 'dojo/i18n!./nls/QueryParcel',
    'spw/api/SpwBaseTemplatedWidget',
    'esri/geometry/Point', 'esri/SpatialReference', "esri/InfoTemplate",
    'esri/graphic', 'esri/symbols/SimpleMarkerSymbol',
    "dojo/dom-construct", "dojo/aspect", "dojo/dom-class",
    'dojo/request', "spw/libs/terraformer-1.0.3.min",
    // il faut le charger car utilisé dans le template
    // mais nous ne sommes pas obligés de l'utiliser
    'dijit/form/ToggleButton'
], function(declare, lang, on,
            tmpl, labels, _Templated,
            Point, SpatialReference, InfoTemplate,
            Graphic, SimpleMarkerSymbol,
            domConstruct, aspect, domClass,
            request) {

    return declare(_Templated, {

        templateString: tmpl,

        labels: labels,

        // Required Terrformer library reference
        _terrafomer: (typeof Terraformer !== 'undefined') ? Terraformer : null,

        _inSpatialReference : new SpatialReference({wkid: 31370}),

        "infoTemplate": {
            "title": "Cadastre",
            "content": "<table><tr><td>Nom commune: </td><td>${NOM_COMMUNE}</td></tr><tr><td>Code INS: </td><td>${COMMUNE}</td></tr><tr><td>Capakey: </td><td>${CAPAKEY}</td></tr><tr><td>Nom division: </td><td>${DIV_NOM}</td></tr><tr><td>Code division: </td><td>${CODE_DIV}</td></tr><tr><td>Section: </td><td>${SECT}</td></tr><tr><td>Radical: </td><td>${RADICAL}</td></tr><tr><td>Bis: </td><td>${BIS}</td></tr><tr><td>Exposant: </td><td>${EXPOSANT}</td></tr><tr><td>Puissance: </td><td>${PUISSANCE}</td></tr><tr><td>Version: </td><td>${VER}</td></tr></table>"
        },
        "infoWindowSize": {
            "width": 400,
            "height": 200
        },

        urbanRestApiUrl : '/urbanmap',
        // config de base pouvant être surchargée dans le widgets.json
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

        // méthode appelée automatiquement après la création du widget
        postCreate: function() {
            this.inherited(arguments); // appelle la fonction de la classe parente

            // - this.own permet d'enregistrer l'event pour qu'il soit automatiquement supprimé
            //   à la destruction du widget.
            // - lang.hitch permet de créer une fonction avec un contexte particulier. Ainsi,
            //   le this de la fonction correspondera bien au widget
            this.own(on(this._queryParcelButton, 'change', lang.hitch(this, this.onDrawChanged)));
        },

        onDeactivate: function() {
            this.inherited(arguments);

            this._queryParcelButton.set('checked', false);
            this.removeGraphic();
        },

        onDrawChanged: function() {
            var checked = this._queryParcelButton.get('checked');

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

        _terraformerConverter: function (geojson) {
            var json,
                arcgis;
            // Convert the geojson object to a Primitive json representation
            json = new this._terrafomer.Primitive(geojson);
            // Convert to ArcGIS JSON
            arcgis = this._terrafomer.ArcGIS.convert(json);
            return arcgis;
        },

        onMapClicked: function(x, y, srid) {
            this.removeGraphic();

            var urbanMapSearhCapakeyUrl = this.urbanRestApiUrl + "/" + "parcels/spatial_search";
            var wktPoint = "POINT("+ x + " " + y + ")";
            request(urbanMapSearhCapakeyUrl ,{
                'Content-Type': 'application/x-www-form-urlencoded',
                'method' : 'POST',
                'data' : {
                    'geom' : wktPoint
                }
            }).then(lang.hitch(this, function(data){
                var esriJson = this._terraformerConverter(JSON.parse(data));
                
                this.graphs = [];
                var symbol = new SimpleMarkerSymbol(this.symbol);
                for (i = 0; i < esriJson.length; i++) {
                     var feature = esriJson[i];

                     var graphic = new Graphic(feature, symbol);
                     graphic.geometry.setSpatialReference(this._inSpatialReference);
                     // Add to graphics
                     this.graphs.push(graphic)
                 }
                 
                 lang.hitch(this, this.displayResultAndZoom({ 'features' : this.graphs }));
                 //this.spwViewer.get('spwMap').showFeatures(this.graphs);
               
            }));

            this._queryParcelButton.set('checked', false);
        },
        onDeactivate: function() {
            this.inherited(arguments);
            this.removeGraphic();
        },
        removeGraphic: function() {
            this.graphs && this.spwViewer.get('spwMap').removeFeature(this.graphs);
            this.graphs = [];
        },
        displayResultAndZoom : function(featureSet){
            if(featureSet.features.length <= 0) return;

            if(this.removeOnClose){
                on(this.spwViewer.get('spwMap').get('esriMap').infoWindow, "hide", lang.hitch(this,function(){
                    this.spwViewer.get('spwMap').removeFeatures(featureSet.features);
                }));
            }

            for(var i=0; i<featureSet.features.length; i++){
                if (featureSet.features[i] && featureSet.features[i].geometry) {
                    featureSet.features[i].geometry.setSpatialReference(this.spwViewer.get('spatialReference'));
                 }
            }
            
            if(this.infoTemplate != null && this.infoTemplate != ""){
                var infoTemplate = new InfoTemplate(this.infoTemplate);
                for(var i=0; i<featureSet.features.length; i++){
                    featureSet.features[i].setInfoTemplate(infoTemplate);
                }
                if(this.infoWindowSize != null){
                    this.spwViewer.get('spwMap').resizeInfoWindow(this.infoWindowSize.width,this.infoWindowSize.height);
                }
            }
            
            this.spwViewer.get('spwMap').showFeatures(featureSet.features);
            var infoWindow = this.spwViewer.get('spwMap').get('esriMap').infoWindow;
            
            var addDeleteButton = lang.hitch(this, function(featureOrEvent) {
                var curr = infoWindow.getSelectedFeature();
                if (infoWindow._deleteButton) {
                    domConstruct.destroy(infoWindow._deleteButton);
                }
                
                if (curr == null && featureSet.features.indexOf(featureOrEvent) < 0) {
                    return;
                }
                else if (curr == null) {
                    curr = featureOrEvent;
                }
                if (featureSet.features.indexOf(curr) > -1) {
                    var link = infoWindow._deleteButton = domConstruct.create('a', {
                        'class': 'action zoomTo',
                        'style': 'float: right;',
                        innerHTML: 'Supprimer',
                        href: 'javascript:void(0);'
                    }, infoWindow._actionList);
                    
                    domClass.remove(infoWindow._actionList, 'hidden');

                    on(link, 'click', lang.hitch(this, function() {
                        this.spwViewer.get('spwMap').removeFeature(curr);
                        if (infoWindow.features && infoWindow.features.length > 1) {
                            infoWindow.selectNext();
                        }
                        else {
                            infoWindow.hide();
                        }
                    }));
                }
            });
            if(this.autoOpenTemplate != null && this.autoOpenTemplate && featureSet.features[0]){
                var handler = this.spwViewer.get('spwMap').on('MapExtentChanged', lang.hitch(this, function(){
                    handler.remove();
                    if(typeof featureSet.features[0].geometry.getPoint != 'undefined'){
                        this.spwViewer.get('spwMap').showInfoWindowAt(infoTemplate.title, Utils.mergeTemplateWithFeature(infoTemplate.content, featureSet.features[0]),featureSet.features[0].geometry.getPoint(0,0));
                    } if(featureSet.geometryType == "esriGeometryPoint"){
                        this.spwViewer.get('spwMap').showInfoWindowAt(infoTemplate.title, Utils.mergeTemplateWithFeature(infoTemplate.content, featureSet.features[0]),featureSet.features[0].geometry);
                    } else {
                         this.spwViewer.get('spwMap').showInfoWindowAt(infoTemplate.title, Utils.mergeTemplateWithFeature(infoTemplate.content, featureSet.features[0]),this.spwViewer.get('spwMap').getCurrentExtent().getCenter());
                    }
                    addDeleteButton(featureSet.features[0]);
                }));
            }
            on(infoWindow, 'show', addDeleteButton);
            aspect.after(infoWindow, 'onSelectionChange', addDeleteButton);
            infoWindow.setFeatures(featureSet.features);
            this.spwViewer.get('spwMap').zoomToFeatures(featureSet.features);
        }
    });
});