/**
 * @class imio.widget.OwnerSearch
 */
define([
    "dojo/_base/declare", "spw/api/SpwBaseTemplatedWidget", "dojo/text!./templates/OwnerSearch.html",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "dojo/_base/Color",
    "dojo/_base/lang", "dojo/request", "dijit/form/FilteringSelect", "dijit/form/TextBox", "spw/api/Utils",
    "dojo/_base/array", "spw/api/MessageManager", "esri/geometry/Polygon", "esri/geometry/Point",
    "dojo/store/Memory", "dojo/data/ObjectStore", "dojo/i18n!./nls/OwnerSearch", "dojo/dom-style",
    "spw/api/ProjectionManager", "dojo/Deferred", "dojo/promise/all", "esri/InfoTemplate", "dojo/on",
    "dojo/dom-construct", "dojo/aspect", "dojo/dom-class", "dijit/registry", 'esri/SpatialReference', "spw/libs/terraformer-1.0.3.min",
    "dijit/form/Button"
], function(declare, SpwBaseTemplatedWidget, template, SimpleFillSymbol, SimpleLineSymbol, Graphic,
            Color, lang, request, FilteringSelect, TextBox, Utils, array, MessageManager, Polygon, Point,
            Memory, ObjectStore, labels, domStyle, ProjectionManager, Deferred, all, InfoTemplate, on,
            domConstruct, aspect, domClass, registry, SpatialReference) {
    return declare("imio.widget.OwnerSearch", [SpwBaseTemplatedWidget], /** @lends imio.widget.OwnerSearch.prototype */{
        templateString: template,
        labels: labels,
        version: null,
        nameTextBox: null,
        surnameTextBox: null,
        addressTextbox: null,
        selectedName: null,
        selectedSurname: null,
        selectedAddress: null,
        selectOnMap: false,
        selectingOnMap: false,
        currentShape: null,
        symbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255,0.5]), 2), new Color([255,255,0,0.3])),
        useCors: true,
        /* START widget config */
        urbanRestApiUrl: "//geo.imio-api.be/urbanmap",
        apiSRID: 31370,
        infoTemplate: {
            title: 'Attributs',
            content: '<table> <tr> <td style="text-align: right;"><strong>Capakey</strong> : </td> <td>${capakey}</td> </tr> <tr> <td style="text-align: right;"><strong>Commune</strong> : </td> <td>${nomCommune} - ${commune}</td> </tr> <tr> <td style="text-align: right;"><strong>Division</strong> : </td> <td>${divNom}</td> </tr> <tr> <td style="text-align: right;"><strong>Section</strong> : </td> <td>${sect}</td> </tr> <tr> <td style="text-align: right;"><strong>Radical</strong> : </td> <td>${radical}</td> </tr> <tr> <td style="text-align: right;"><strong>Exposant</strong> : </td> <td>${exposant}</td> </tr> <tr> <td style="text-align: right;"><strong>Puissance</strong> : </td> <td>${puissance}</td> </tr> <tr> <td style="text-align: right;"><strong>Version</strong> : </td> <td>${ver}</td> </tr> </table>'
        },
        infoWindowSize: null,
        autoOpenTemplate: false,
        removeOnClose: true,
        loadOnStartup: true,
        widgetTitle: 'Localiser une parcelle par propriétaire (${version})',
        /* style: {
            width: "350px"
        }, */
        /* END widget config */

        // Required Terrformer library reference
        _terrafomer: (typeof Terraformer !== 'undefined') ? Terraformer : null,

        _inSpatialReference : new SpatialReference({wkid: 31370}),

        postCreate: function() {
            this.inherited(arguments);
            this.currentShapes = [];
            var spwMap = this.spwViewer.get('spwMap');
            this.own(on(this._submitOwnerSearchButton, 'click', lang.hitch(this, this.searchOwners)));
            this.own(on(this._resetOwnerSearchButton, 'click', lang.hitch(this, this.raz)));
        },
 
        onDeactivate: function(){
            this.inherited(arguments);
            if (this.removeOnClose) {
                //this.raz();
            }
        },

        startup: function() {
            this.inherited(arguments);

        },
        displayShape: function(data) {
            if(data.polygones) {
                var shape = new Graphic(this.parseShape(data.polygones), this.symbol);
                this.currentShapes.push(shape);
                this.spwViewer.get('spwMap').showFeature(shape);
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

        onGetShapeFault: function(error) {
            MessageManager.getInstance().notifyError(this.labels.getShapeFault + error);
        },

        searchOwners: function() {
            var firstnameBox = registry.byId("firstname");
            var surnameBox = registry.byId("surname");
            var addressBox = registry.byId("address");
            
            var firstname = firstnameBox.get("value");
            var surname = surnameBox.get("value");
            var address = addressBox.get("value");

            var searchUrl  = this.urbanRestApiUrl + '/parcels/owner_search'
            this.raz();
            request.post(searchUrl, {
                'data': {
                    'firstname': firstname,
                    'surname': surname,
                    'address': address
                },
                'Content-Type': 'application/x-www-form-urlencoded'
            }).then(lang.hitch(this, function(data){
                var esriJson = this._terraformerConverter(JSON.parse(data));
                
                this.currentShapes = [];
                //var symbol = new SimpleMarkerSymbol(this.symbol);
                for (i = 0; i < esriJson.length; i++) {
                     var feature = esriJson[i];

                     var graphic = new Graphic(feature, this.symbol);
                     graphic.geometry.setSpatialReference(this._inSpatialReference);
                     // Add to graphics
                     this.currentShapes.push(graphic)
                 }
                 lang.hitch(this, this.displayResultAndZoom({ 'features' : this.currentShapes }));

            }), lang.hitch(this, function(err) {
                this.onGetShapeFault(err);
            }));
        },
 
        raz: function() {
            if(this.currentShapes){
                this.spwViewer.get('spwMap').removeFeatures(this.currentShapes);
                this.currentShapes = [];
            }
            if (this.initialFeatures) {
                this.spwViewer.get('spwMap').removeFeatures(this.initialFeatures);
                this.initialFeatures = null;
            }
            registry.byId("firstname").set("value","");
            registry.byId("surname").set("value","");
            registry.byId("address").set("value","");
        },

        displayResultAndZoom : function(featureSet){
            if(featureSet.features.length <= 0) return;
            var urbanMapParcelInfoByCapakeyUrl = this.urbanRestApiUrl + "/" + "parcelsinfo/capakeys/";


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
                
                for(var i=0; i<featureSet.features.length; i++){
                    
                    var currentFeature = featureSet.features[i];
                    request(urbanMapParcelInfoByCapakeyUrl + currentFeature.attributes.pk).then(lang.hitch(this, function(data){
                        var response = JSON.parse(data);
                        if( response && response.length > 0) {
                            Object.assign(currentFeature.attributes, response[0].fields);
                        } else {
                            console.error("No parcel info for " + currentFeature.attributes.pk);
                        }
                        var infoTemplate = new InfoTemplate(this.infoTemplate);
                        currentFeature.setInfoTemplate(infoTemplate);
                    }));
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