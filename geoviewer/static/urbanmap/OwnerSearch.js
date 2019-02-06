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
    "dojo/dom-construct", "dojo/aspect", "dojo/dom-class",
    "dijit/form/Button"
], function(declare, SpwBaseTemplatedWidget, template, SimpleFillSymbol, SimpleLineSymbol, Graphic,
            Color, lang, request, FilteringSelect, TextBox, Utils, array, MessageManager, Polygon, Point,
            Memory, ObjectStore, labels, domStyle, ProjectionManager, Deferred, all, InfoTemplate, on,
            domConstruct, aspect, domClass) {
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
        urbanmapApiUrl: "//geo.imio-api.be/urbanmap/",
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
        style: {
            width: "400px"
        },
        /* END widget config */

        postCreate: function() {
            this.inherited(arguments);
            this.currentShapes = [];
            var spwMap = this.spwViewer.get('spwMap');
            spwMap.on(spwMap.events.MapClicked, lang.hitch(this, this.onSpwMapClick));
        },
 
        onDeactivate: function(){
            this.inherited(arguments);
            if (this.removeOnClose) {
                this.raz();
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
        parseShape: function(polygones) {
            if (polygones == null) {
                return null;
            }
            var polygon = new Polygon(this.spwViewer.get('spatialReference'));
            for(var i=0; i < polygones.length; i++) {
                var points = new Array();
                if(polygones[i].coordonnees) {
                    for(var j=0; j < polygones[i].coordonnees.length; j++) {
                        var pt = ProjectionManager.getInstance().projectPoint(this.apiSRID, this.spwViewer.get('spatialReference').wkid,
                            polygones[i].coordonnees[j].x, polygones[i].coordonnees[j].y);
                        points.push(new Point(pt.x, pt.y, this.spwViewer.get('spatialReference')));
                    }
                }
                polygon.addRing(points);
            }
            return polygon;
        },
        onGetShapeFault: function(request, status, error) {
            MessageManager.getInstance().notifyError(this.labels.getShapeFault + error);
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
        }
    });
});