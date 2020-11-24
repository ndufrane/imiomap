/* UrbanHome */
define([
    'dojo/_base/declare', 
    'spw/api/SpwBaseWidget'
], function(declare,
            _Templated) {

    return declare(_Templated, {

        urbanUrl: "/",

        iconClass: "homeIcon",

        // méthode appelée automatiquement après la création du widget
        postCreate: function() {
            this.inherited(arguments); // appelle la fonction de la classe parente
        },

        onActivate: function() {
            this.inherited(arguments);
            window.location.href = "/urban";
        },

        onDeactivate: function() {
            this.inherited(arguments);
        }
    });

});