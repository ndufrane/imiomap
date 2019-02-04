/* ParcelIdentity */
define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/on',
    'dojo/text!./templates/ParcelIdentity.html', 'dojo/i18n!./nls/ParcelIdentity',
    'spw/api/SpwBaseTemplatedWidget',
    'esri/geometry/Point', 'esri/SpatialReference',
    'dijit/Dialog', 'dojo/request',
    // il faut le charger car utilisé dans le template
    // mais nous ne sommes pas obligés de l'utiliser
    'dijit/form/ToggleButton'
], function(declare, lang, on,
            tmpl, labels, _Templated,
            Point, SpatialReference,
            Dialog, request) {

    return declare(_Templated, {

        templateString: tmpl,

        labels: labels,

        urbanUrl: "parcelsinfo",
        urbanRestApiUrl : '/urbanmap',
        active: false,
        
        // méthode appelée automatiquement après la création du widget
        postCreate: function() {
            this.inherited(arguments); // appelle la fonction de la classe parente
        },

        onActivate: function() {
            this.inherited(arguments);
            this.active = true;
            var map = this.spwViewer.get('spwMap');
            this._handler = on(map, map.events.MapClicked, lang.hitch(this, this.onMapClicked));
        },

        onDeactivate: function() {
            this.inherited(arguments);
            this._handler && this._handler.remove();
            this._handler = null;

            this.removeGraphic();
            this.active = false;
        },

        onMapClicked: function(x, y, srid) {
            this.removeGraphic();
            var urbanMapSearhCapakeyUrl = this.urbanRestApiUrl + "/" + "parcels/capakey_spatial_search";
            var wktPoint = "POINT("+ x + " " + y + ")";
            request(urbanMapSearhCapakeyUrl ,{
                'Content-Type': 'application/x-www-form-urlencoded',
                'method' : 'POST',
                'data' : {
                    'geom' : wktPoint
                }
            }).then(lang.hitch(this, function(data){
                if(data && data.length > 0) {
                    request(this.urbanUrl+"?capakey=" + data[0].pk, {
                        'method' : 'GET',
                    }).then(lang.hitch(this, function(data){
                        var parcelIdentityDialog = new Dialog({
                            title: "Carte d'identité parcellaire",
                            content: data,
                            style: "width: 300px"
                        });
                        parcelIdentityDialog.show()
                    }));
                }
            }));
        },

        removeGraphic: function() {
            this.graph && this.spwViewer.get('spwMap').removeFeature(this.graph);
            this.graph = null;
        }

    });

});