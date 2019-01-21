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
        
        // méthode appelée automatiquement après la création du widget
        postCreate: function() {
            this.inherited(arguments); // appelle la fonction de la classe parente

            // - this.own permet d'enregistrer l'event pour qu'il soit automatiquement supprimé
            //   à la destruction du widget.
            // - lang.hitch permet de créer une fonction avec un contexte particulier. Ainsi,
            //   le this de la fonction correspondera bien au widget
            this.own(on(this._parcelIdentityButton, 'change', lang.hitch(this, this.onDrawChanged)));
        },

        onDeactivate: function() {
            this.inherited(arguments);

            this._parcelIdentityButton.set('checked', false);
            this.removeGraphic();
        },

        onDrawChanged: function() {
            var checked = this._parcelIdentityButton.get('checked');

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
                    request(this.urbanUrl, {
                        'method' : 'GET',
                        'data' : {
                            'capakey' : data
                        }
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

            this._parcelIdentityButton.set('checked', false);
        },

        removeGraphic: function() {
            this.graph && this.spwViewer.get('spwMap').removeFeature(this.graph);
            this.graph = null;
        }

    });

});