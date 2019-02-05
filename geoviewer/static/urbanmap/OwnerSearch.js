/**
 * @class imio.widget.OwnerSearch
 */
define([
    "dojo/_base/declare", "spw/api/SpwBaseTemplatedWidget", "dojo/text!./templates/ImioOwnerSearch.html",
    "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/graphic", "dojo/_base/Color",
    "dojo/_base/lang", "dojo/request", "dijit/form/FilteringSelect", "dijit/form/TextBox", "spw/api/Utils",
    "dojo/_base/array", "spw/api/MessageManager", "esri/geometry/Polygon", "esri/geometry/Point",
    "dojo/store/Memory", "dojo/data/ObjectStore", "dojo/i18n!./nls/ImioOwnerSearch", "dojo/dom-style",
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
        nameFilteringSelect: null,
        surnameFilteringSelect: null,
        addressFilteringSelect: null,
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
        _titleWithVersion: "",
        postMixInProperties: function() {
            this.inherited(arguments);
            if(this.widgetTitle && /\$\{version\}/.test(this.widgetTitle)){
                this._titleWithVersion = this.widgetTitle;
                this.widgetTitle = this.widgetTitle.replace(/\$\{version\}/, "");
            }
        },
        _setWidgetTitleAttr: function(value){
            this.inherited(arguments);
            if(this.getParent && this.getParent() && this.getParent().title){
                this.getParent().set('title', this.get('widgetTitle'));
            } else if(this.getParent && this.getParent() && this.getParent().titleNode) {
            	this.getParent().titleNode.childNodes[0].innerHTML = this.get('widgetTitle');
            }
        },
        postCreate: function() {
            this.inherited(arguments);
            this.currentShapes = [];
            var spwMap = this.spwViewer.get('spwMap');
            spwMap.on(spwMap.events.MapClicked, lang.hitch(this, this.onSpwMapClick));
            this.initFilteringSelects();
        },
        regexSplitParam: /[a-zA-Z]|\/|_/g,
        getFromCapakeyMethod: 'getShapeParcellesByBis',
        queryFromURLParam: function (value) {
            var capakeys = value.split(',');
            var defs = array.map(capakeys, lang.hitch(this, function(capakey) {
                var def = new Deferred();
                this.regexSplitParam.lastIndex = 0; // reset la fonction .exec...
                var param = {};
                var vals = capakey.split(this.regexSplitParam);
                if (vals.length > 1) {
                    var offset = 0;
                    for (var i = 0; i < vals.length; ++i) {
                        var match = this.regexSplitParam.exec(capakey);
                        param[i + offset + 1] = vals[i];
                        if (match) {
                            param[i + offset + 2] = match[0];
                            offset += 1;
                        }
                    }
                }
                // codeDiv, sect, radical, exposant, puissance, bis, onSuccess, onError
                spwCadmap[this.getFromCapakeyMethod](param[1], param[2], param[3], param[6], param[7], param[5],
                    lang.hitch(this, function(result) {
                        if (result == null || result.length < 1) {
                            MessageManager.getInstance().notifyError('Aucune parcelle ' + capakey);
                            def.resolve(null);
                            return;
                        }
                        def.resolve(result[0]);
                    }), lang.hitch(this, function(err) {
                        console.error(err);
                        def.reject(capakey);
                    })
                );
                return def;
            }));
            all(defs).then(lang.hitch(this, function(results) {
                var extent = null;
                var features = [];
                var infoTemplate = new InfoTemplate(this.infoTemplate.title, this.infoTemplate.content);
                array.forEach(results, lang.hitch(this, function(result, i) {
                    if (result == null) {
                        return;
                    }
                    var geom = this.parseShape(result.polygones);
                    if (geom == null) {
                        return;
                    }
                    var feature = new Graphic(geom, this.symbol, result, infoTemplate);
                    this.spwViewer.get('spwMap').showFeature(feature);
                    features.push(feature);
                    if (extent == null) {
                        extent = geom.getExtent();
                    }
                    else {
                        extent = extent.union(geom.getExtent());
                    }
                    if (i === results.length - 1) {
                        this.parcelleFromXY = result;
                        this.selectCommuneFromParcelleFromXY();
                    }
                }));
                if (this.infoWindowSize != null) {
                    this.spwViewer.get('spwMap').resizeInfoWindow(this.infoWindowSize.width, this.infoWindowSize.height);
                }
                var infoWindow = this.spwViewer.get('spwMap').get('esriMap').infoWindow;
                if (this.removeOnClose) {
                    on(infoWindow, "hide", lang.hitch(this,function(){
                        this.spwViewer.get('spwMap').removeFeatures(features);
                    }));
                }
                var addDeleteButton = lang.hitch(this, function(featureOrEvent) {
                    var curr = infoWindow.getSelectedFeature();
                    if (infoWindow._deleteButton) {
                        domConstruct.destroy(infoWindow._deleteButton);
                    }
                    if (curr == null && features.indexOf(featureOrEvent) < 0) {
                        return;
                    }
                    else if (curr == null) {
                        curr = featureOrEvent;
                    }
                    if (features.indexOf(curr) > -1) {
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
                on(infoWindow, 'show', addDeleteButton);
                aspect.after(infoWindow, 'onSelectionChange', addDeleteButton);
                if (this.autoOpenTemplate) {
                    var first = features[0];
                    var handler = this.spwViewer.get('spwMap').on('MapExtentChanged', lang.hitch(this, function(){
                        handler.remove();
                        if(typeof first.geometry.getPoint != 'undefined'){
                            this.spwViewer.get('spwMap').showInfoWindowAt(this.infoTemplate.title, Utils.mergeTemplateWithFeature(this.infoTemplate.content, first), first.geometry.getPoint(0,0));
                        } if(first.geometry.geometryType == "esriGeometryPoint"){
                            this.spwViewer.get('spwMap').showInfoWindowAt(this.infoTemplate.title, Utils.mergeTemplateWithFeature(this.infoTemplate.content, first), first.geometry);
                        } else {
                            this.spwViewer.get('spwMap').showInfoWindowAt(this.infoTemplate.title, Utils.mergeTemplateWithFeature(this.infoTemplate.content, first), this.spwViewer.get('spwMap').getCurrentExtent().getCenter());
                        }
                        addDeleteButton(first);
                    }));
                }
                this.spwViewer.get('spwMap').zoomToExtent(extent, true);
                this.initialFeatures = features;
            }), lang.hitch(this, function(err) {
                MessageManager.getInstance().notifyError('Impossible de récupérer la parcelle ' + value);
            }));
        },
        onDeactivate: function(){
            this.inherited(arguments);
            if (this.removeOnClose) {
                this.raz();
            }
        },
        displayMessageNoSpwCadmap: function() {
            this._tableForm.style.display = "none";
            this._noSpwCadmapDiv.style.display = "";
        },
        startup: function() {
            this.inherited(arguments);
            this.communesFilteringSelect.startup();
            this.divisionsFilteringSelect.startup();
            this.sectionsFilteringSelect.startup();
            this.radicauxFilteringSelect.startup();
            this.exposantsFilteringSelect.startup();
            this.puissancesFilteringSelect.startup();
            this.bisFilteringSelect.startup();
        },
        initFilteringSelects: function() {
            var ctx = this;
            this.version = new TextBox({
                name: "version",
                value: "version"
            }, this._spwGeolocalisationPopupCadmapWidgetOutputVersionHolder);
            this.communesFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                labelAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("COMMUNES");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputCommunesHolder);
            this.own(this.communesFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.communesFilteringSelect.item) {
                    this.onChangeSelect("COMMUNES", this.communesFilteringSelect.item);
                }
            })));
            this.divisionsFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("DIVISIONS");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputDivisionsHolder);
            this.own(this.divisionsFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.divisionsFilteringSelect.item) {
                    this.onChangeSelect("DIVISIONS", this.divisionsFilteringSelect.item);
                }
            })));
            this.sectionsFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("SECTIONS");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputSectionsHolder);
            this.own(this.sectionsFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.sectionsFilteringSelect.item) {
                    this.onChangeSelect("SECTIONS", this.sectionsFilteringSelect.item);
                }
            })));
            this.radicauxFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("RADICAUX");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputRadicauxHolder);
            this.own(this.radicauxFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.radicauxFilteringSelect.item) {
                    this.onChangeSelect("RADICAUX", this.radicauxFilteringSelect.item);
                }
            })));
            this.exposantsFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("EXPOSANTS");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputExposantsHolder);
            this.own(this.exposantsFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.exposantsFilteringSelect.item) {
                    this.onChangeSelect("EXPOSANTS", this.exposantsFilteringSelect.item);
                }
            })));
            this.puissancesFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("PUISSANCES");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputPuissancesHolder);
            this.own(this.puissancesFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.puissancesFilteringSelect.item) {
                    this.onChangeSelect("PUISSANCES", this.puissancesFilteringSelect.item);
                }
            })));
            this.bisFilteringSelect = new FilteringSelect({
                searchAttr: "label",
                hasDownArrow: true,
                autoComplete: false,
                queryExpr: "*${0}*",
                highlightMatch: "none",
                required: false,
                disabled: true,
                onKeyUp: function(){
                    if(this.get('displayedValue').length == 0){
                        this.closeDropDown();
                        ctx.initFilteringSelectsStyles("BIS");
                    }
                },
                onFocus: function() {
                    this.loadDropDown();
                }
            }, this._spwGeolocalisationPopupCadmapWidgetInputBisHolder);
            this.own(this.bisFilteringSelect.watch("item", lang.hitch(this, function(){
                if(this.bisFilteringSelect.item) {
                    this.onChangeSelect("BIS", this.bisFilteringSelect.item);
                }
            })));
        },
        createQueryEngine: function(){
            return function(query, options){
                var filteringFunction = function(object){
                    if(options.query.label.length > 0 && Utils.removeAccent(object.label).indexOf(Utils.removeAccent(options.query.label)) > -1){
                        return true;
                    }
                    return false;
                };
                var execute = function(arr){
                    var results = array.filter(arr, filteringFunction);
                    return results.sort(function(a, b){
                        if(Utils.removeAccent(a.label) == Utils.removeAccent(b.label)) return 0;
                        else if(Utils.removeAccent(a.label) > Utils.removeAccent(b.label)) return 1;
                        else return -1;
                    });
                };
                execute.matches = filteringFunction;
                return execute;
            };
        },
        initFilteringSelectsStyles: function(type) {
            switch(type) {
                case "ALL":
                    this.selectedCommune = null;
                    // Il faut check domNode ici car cette fonction est appelée lors
                    // d'un changement de contexte APRES que le dom ait été supprimé
                    // et comme FilteringSelect ne teste pas que le dom existe avant
                    // de modifier la valeur affichée -> error !
                    if (this.communesFilteringSelect && this.communesFilteringSelect.domNode) {
                        this.communesFilteringSelect.set("value", null);
                    }
                case "COMMUNES":
                    this.selectedDivision = null;
                    if (this.divisionsFilteringSelect && this.divisionsFilteringSelect.domNode) {
                        this.divisionsFilteringSelect.set("value", null);
                        this.divisionsFilteringSelect.set("disabled", true);
                    }
                case "DIVISIONS":
                    this.selectedSection = null;
                    if (this.sectionsFilteringSelect && this.sectionsFilteringSelect.domNode) {
                        this.sectionsFilteringSelect.set("value", null);
                        this.sectionsFilteringSelect.set("disabled", true);
                    }
                case "SECTIONS":
                    this.selectedRadical = null;
                    if (this.radicauxFilteringSelect && this.radicauxFilteringSelect.domNode) {
                        this.radicauxFilteringSelect.set("value", null);
                        this.radicauxFilteringSelect.set("disabled", true);
                    }
                case "RADICAUX":
                    this.selectedExposant = null;
                    if (this.exposantsFilteringSelect && this.exposantsFilteringSelect.domNode) {
                        this.exposantsFilteringSelect.set("value", null);
                        this.exposantsFilteringSelect.set("disabled", true);
                    }
                case "EXPOSANTS":
                    this.selectedPuissance = null;
                    if (this.puissancesFilteringSelect && this.puissancesFilteringSelect.domNode) {
                        this.puissancesFilteringSelect.set("value", null);
                        this.puissancesFilteringSelect.set("disabled", true);
                    }
                case "PUISSANCES":
                    this.selectedBis = null;
                    if (this.bisFilteringSelect && this.bisFilteringSelect.domNode) {
                        this.bisFilteringSelect.set("value", null);
                        this.bisFilteringSelect.set("disabled", true);
                    }
            }
        },
        onChangeSelect: function(type, item) {
            this.initFilteringSelectsStyles(type);
            switch(type) {
                case "COMMUNES":
                    this.selectedCommune = item;
                    this.getListeDivisions();
                    break;
                case "DIVISIONS":
                    this.selectedDivision = item;
                    this.getListeSections();
                    break;
                case "SECTIONS":
                    this.selectedSection = item;
                    this.getListeRadicaux();
                    break;
                case "RADICAUX":
                    this.selectedRadical = item;
                    this.getListeExposants();
                    break;
                case "EXPOSANTS":
                    this.selectedExposant = item;
                    this.getListePuissances();
                    break;
                case "PUISSANCES":
                    this.selectedPuissance = item;
                    this.getListeBis();
                    break;
                case "BIS":
                    this.selectedBis = item;
                    break;
                default:
                    break;
            }
        },
        checkSpwCadmapApi: function() {
            if(typeof(spwCadmap) == "undefined"){
                //désactivé pour une démo
                //MessageManager.getInstance().notifyError(this.labels.cadmapServiceUnavailable);
                return false;
            }
            else {
                return true;
            }
        },
        getVersion: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getVersion(
                        lang.hitch(this, this.onGetVersionResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
                this.getListeCommunes();
            }
        },
        getListeCommunes: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeCommunes(
                    lang.hitch(this, function(data) {
                        this.onGetListeResult("COMMUNES", data);
                        var capakey = Utils.gua(this.urlField);
                        if(this.loadOnStartup && capakey && capakey !== ""){
                            this.queryFromURLParam(capakey);
                        }
                    }),
                    lang.hitch(this, function(request, status, error){ this.onGetListeFault("COMMUNES", request, status, error); })
                );
            }
        },
        getShapeCommune: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeCommune(
                    this.selectedCommune.ins,
                    lang.hitch(this, this.onGetShapeResult),
                    lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListeDivisions: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeDivisions(
                    this.selectedCommune.ins,
                    lang.hitch(this, function(data) { this.onGetListeResult("DIVISIONS", data); }),
                    lang.hitch(this, function(request, status, error){ this.onGetListeFault("DIVISIONS", request, status, error); })
                );
            }
        },
        getShapeDivision: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeDivision(
                    this.selectedDivision.codeDiv,
                    lang.hitch(this, this.onGetShapeResult),
                    lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListeSections: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeSections(
                        this.selectedDivision.codeDiv,
                        lang.hitch(this, function(data) { this.onGetListeResult("SECTIONS", data); }),
                        lang.hitch(this, function(request, status, error){ this.onGetListeFault("SECTIONS", request, status, error); })
                    );
            }
        },
        getShapeSection: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeSection(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        lang.hitch(this, this.onGetShapeResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListeRadicaux: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeRadicaux(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        lang.hitch(this, function(data) { this.onGetListeResult("RADICAUX", data); }),
                        lang.hitch(this, function(request, status, error){ this.onGetListeFault("RADICAUX", request, status, error); })
                    );
            }
        },
        getShapeParcellesByRadical: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeParcellesByRadical(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        lang.hitch(this, this.onGetShapeResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListeExposants: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeExposants(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        lang.hitch(this, function(data) { this.onGetListeResult("EXPOSANTS", data); }),
                        lang.hitch(this, function(request, status, error){ this.onGetListeFault("EXPOSANTS", request, status, error); })
                    );
            }
        },
        getShapeParcellesByExposant: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeParcellesByExposant(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        this.selectedExposant.exposant,
                        lang.hitch(this, this.onGetShapeResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListePuissances: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListePuissances(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        this.selectedExposant.exposant,
                        lang.hitch(this, function(data) { this.onGetListeResult("PUISSANCES", data); }),
                        lang.hitch(this, function(request, status, error){ this.onGetListeFault("PUISSANCES", request, status, error); })
                    );
            }
        },
        getShapeParcellesByPuissance: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeParcellesByPuissance(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        this.selectedExposant.exposant,
                        this.selectedPuissance.puissance,
                        lang.hitch(this, this.onGetShapeResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        getListeBis: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getListeBis(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        this.selectedExposant.exposant,
                        this.selectedPuissance.puissance,
                        lang.hitch(this, function(data) { this.onGetListeResult("BIS", data); }),
                        lang.hitch(this, function(request, status, error){ this.onGetListeFault("BIS", request, status, error); })
                    );
            }
        },
        getShapeParcellesByBis: function() {
            if(this.checkSpwCadmapApi()){
                spwCadmap.getShapeParcellesByBis(
                        this.selectedDivision.codeDiv,
                        this.selectedSection.sect,
                        this.selectedRadical.radical,
                        this.selectedExposant.exposant,
                        this.selectedPuissance.puissance,
                        this.selectedBis.bis,
                        lang.hitch(this, this.onGetShapeResult),
                        lang.hitch(this, this.onGetShapeFault)
                );
            }
        },
        onGetListeResult: function(type, data) {
            var filteringSelect = null;
            var objectToSelect = null;
            switch(type) {
                case "COMMUNES":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].nom + " " + data[i].ins;
                        }
                    }
                    filteringSelect = this.communesFilteringSelect;
                    break;
                case "DIVISIONS":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].codeDiv + " " + data[i].divNom;
                            if(this.parcelleFromXY && this.parcelleFromXY.codeDiv == data[i].codeDiv) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    filteringSelect = this.divisionsFilteringSelect;
                    break;
                case "SECTIONS":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].sect;
                            if(this.parcelleFromXY && this.parcelleFromXY.sect == data[i].sect) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    filteringSelect = this.sectionsFilteringSelect;
                    break;
                case "RADICAUX":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].radical;
                            if(this.parcelleFromXY && this.parcelleFromXY.radical == data[i].radical) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    filteringSelect = this.radicauxFilteringSelect;
                    break;
                case "EXPOSANTS":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].exposant;
                            if(this.parcelleFromXY && this.parcelleFromXY.exposant == data[i].exposant) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    filteringSelect = this.exposantsFilteringSelect;
                    break;
                case "PUISSANCES":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].puissance;
                            if(this.parcelleFromXY && this.parcelleFromXY.puissance == data[i].puissance) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    filteringSelect = this.puissancesFilteringSelect;
                    break;
                case "BIS":
                    if(data && data.length) {
                        for(var i=0;i<data.length;i++) {
                            data[i].label = data[i].bis;
                            if(this.parcelleFromXY && this.parcelleFromXY.bis == data[i].bis) {
                                objectToSelect = data[i];
                            }
                        }
                    }
                    this.parcelleFromXY = null;
                    filteringSelect = this.bisFilteringSelect;
                    break;
                default:
                    break;
            }
            if(filteringSelect != null) {
                var os = new Memory({ data: data, queryEngine: this.createQueryEngine() });
                filteringSelect.set('store', new ObjectStore({ objectStore: os }));
                filteringSelect.set("disabled", false);
                if(objectToSelect) {
                    filteringSelect.set("item", objectToSelect);
                }
            }
        },
        selectCommuneFromParcelleFromXY: function() {
            if(this.parcelleFromXY) {
                for(var i=0; i<this.communesFilteringSelect.store.objectStore.data.length; i++) {
                    if(this.communesFilteringSelect.store.objectStore.data[i].ins == this.parcelleFromXY.commune) {
                        this.communesFilteringSelect.set("item", this.communesFilteringSelect.store.objectStore.data[i]);
                        break;
                    }
                }
            }
        },
        onGetListeFault: function(type, request, status, error) {
            switch(type) {
                case "COMMUNES":
                    MessageManager.getInstance().notifyError(this.labels.getListeCommunesFault + error);
                    break;
                case "DIVISIONS":
                    MessageManager.getInstance().notifyError(this.labels.getListeDivisionsFault + error);
                    break;
                case "SECTIONS":
                    MessageManager.getInstance().notifyError(this.labels.getListeSectionsFault + error);
                    break;
                case "RADICAUX":
                    MessageManager.getInstance().notifyError(this.labels.getListeRadicauxFault + error);
                    break;
                case "EXPOSANTS":
                    MessageManager.getInstance().notifyError(this.labels.getListeExposantsFault + error);
                    break;
                case "PUISSANCES":
                    MessageManager.getInstance().notifyError(this.labels.getListePuissancesFault + error);
                    break;
                case "BIS":
                    MessageManager.getInstance().notifyError(this.labels.getListeBisFault + error);
                    break;
                default:
                    break;
            }
        },
        onGetVersionResult: function(result) {
            this.version.set("value", result.version);
            this.version.set("readOnly", true);
            if(this._titleWithVersion){
                this.set('widgetTitle', this._titleWithVersion.replace(/\$\{version\}/, result.version.replace("V", "")));
            }
        },
        onGetShapeResult: function(data) {
            if(this.currentShapes){
                this.spwViewer.get('spwMap').removeFeatures(this.currentShapes);
                this.currentShapes = [];
            }
            if(data.length) {
                for(var i=0;i<data.length; i++) {
                    this.displayShape(data[i]);
                }
            }
            else {
                this.displayShape(data);
            }
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
        go: function() {
            this.spwViewer.trackEvent("spw.impl.widgets.SpwGeolocalisationPopupCadmapWidget", "go");
            var lastSelectedItem = this.getLastSelectedItem();
            if(lastSelectedItem) {
                if(lastSelectedItem.xMin && lastSelectedItem.xMax && lastSelectedItem.yMin && lastSelectedItem.yMax) {
                    var min = ProjectionManager.getInstance().projectPoint(this.apiSRID, this.spwViewer.get('spatialReference').wkid, lastSelectedItem.xMin, lastSelectedItem.yMin);
                    var max = ProjectionManager.getInstance().projectPoint(this.apiSRID, this.spwViewer.get('spatialReference').wkid, lastSelectedItem.xMax, lastSelectedItem.yMax);
                    this.spwViewer.get('spwMap').zoomToBbox(min.x, max.x, min.y, max.y, this.spwViewer.get('spatialReference').wkid);
                }
                if(this.selectedCommune == lastSelectedItem) {
                    this.getShapeCommune();
                }
                else if(this.selectedDivision == lastSelectedItem) {
                    this.getShapeDivision();
                }
                else if(this.selectedSection == lastSelectedItem) {
                    this.getShapeSection();
                }
                else if(this.selectedRadical == lastSelectedItem) {
                    this.getShapeParcellesByRadical();
                }
                else if(this.selectedExposant == lastSelectedItem) {
                    this.getShapeParcellesByExposant();
                }
                else if(this.selectedPuissance == lastSelectedItem) {
                    this.getShapeParcellesByPuissance();
                }
                else if(this.selectedBis == lastSelectedItem) {
                    this.getShapeParcellesByBis();
                }
            }
            else {
                MessageManager.getInstance().notifyInfo(this.labels.nothingSelected);
            }
        },
        getLastSelectedItem: function() {
            if(this.selectedBis) {
                return this.selectedBis;
            }
            else if(this.selectedPuissance) {
                return this.selectedPuissance;
            }
            else if(this.selectedExposant) {
                return this.selectedExposant;
            }
            else if(this.selectedRadical) {
                return this.selectedRadical;
            }
            else if(this.selectedSection) {
                return this.selectedSection;
            }
            else if(this.selectedDivision) {
                return this.selectedDivision;
            }
            else if(this.selectedCommune) {
                return this.selectedCommune;
            }
            return null;
        },
        raz: function() {
            this.initFilteringSelectsStyles("ALL");
            if(this.currentShapes){
                this.spwViewer.get('spwMap').removeFeatures(this.currentShapes);
                this.currentShapes = [];
            }
            if (this.initialFeatures) {
                this.spwViewer.get('spwMap').removeFeatures(this.initialFeatures);
                this.initialFeatures = null;
            }
        },
        onSpwMapClick: function(x, y) {
            if(this.selectingOnMap) {
                this.parcelleFromXY = null;
                this.raz();
                if(this.checkSpwCadmapApi()){
                    this.spwViewer.trackEvent("spw.impl.widgets.SpwGeolocalisationPopupCadmapWidget", "onSpwMapClick");
                    spwCadmap.getShapeParcelleByXY(
                            x, y,
                            lang.hitch(this, this.onGetShapeFromXYResult),
                            lang.hitch(this, this.onGetShapeFault)
                    );
                }
            }
        },
        onGetShapeFromXYResult: function(data) {
            if(this.currentShapes){
                this.spwViewer.get('spwMap').removeFeatures(this.currentShapes);
                this.currentShapes = [];
            }
            if(data) {
                this.parcelleFromXY = data;
                this.displayShape(data);
                this.selectCommuneFromParcelleFromXY();
            }
        }
    });
});