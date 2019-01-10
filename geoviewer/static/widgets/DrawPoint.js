/* DrawPoint */
define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/on',
    'dojo/text!./templates/DrawPoint.html', 'dojo/i18n!./nls/DrawPoint',
    'spw/api/SpwBaseTemplatedWidget',
    'esri/geometry/Point', 'esri/SpatialReference',
    'esri/graphic', 'esri/symbols/SimpleMarkerSymbol',
    // il faut le charger car utilisé dans le template
    // mais nous ne sommes pas obligés de l'utiliser
    'dijit/form/ToggleButton'
], function(declare, lang, on,
            tmpl, labels, _Templated,
            Point, SpatialReference,
            Graphic, SimpleMarkerSymbol) {

    return declare(_Templated, {

        templateString: tmpl,

        labels: labels,

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
            this.own(on(this._drawButton, 'change', lang.hitch(this, this.onDrawChanged)));
        },

        onDeactivate: function() {
            this.inherited(arguments);

            this._drawButton.set('checked', false);
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