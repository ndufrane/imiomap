define(["dojo/_base/declare","spw/widgets/SpwIdentifyResultTable", "dojo/text!./templates/UrbanIdentifyResultTable.html",
 "dojo/dom-construct", "dojo/_base/lang", "dojo/request","dojo/dom-style", "dojo/query", "dojo/has"],
        function(declare, SpwIdentifyResultTable, template,
             domConstruct, lang, request, Style, Query, Has){

	return declare("imio.widget.UrbanIdentifyResultTable", [SpwIdentifyResultTable], {
        urbanRestApiUrl : '/urbanmap',
        PARCEL_LAYERNAME : 'Parcelles cadastrales',
        templateString: template,
        matriceFields : [
            {name: "capakey", type: "esriFieldTypeString", alias: "CAPAKEY", length: 17, domain: null},
            {name: "nature", type: "esriFieldTypeString", alias: "nature", length: 17, domain: null},
            {name: "datesituation", type: "esriFieldTypeString", alias: "datesituation", length: 17, domain: null},
            {name: "owner", type: "esriFieldTypeString", alias: "proprio", length: 17, domain: null},
        ],
 
        _postCreate: function() {
            if(this._spwAdvancedIdentify == null) {
                Style.set(this._imgUseAsIdentify, "display", "none");
            }
            if(!this._spwLayer.moreInfoPageBaseUrl || !this._spwLayer.moreInfoPageFieldName) {
                Style.set(this._imgMoreInfo, "display", "none");
            }
            
            Style.set(this._imgExportCsv, "display", "inline");
           
            if(this._spwIdentifyResultWidget != null && !this._spwIdentifyResultWidget.allowUseSelectionIdentify) {
                if(!this._spwIdentifyResultWidget.allowUseSelectionIdentify){
                    Style.set(Query(this._imgUseAsIdentify).parent("td")[0], "display", "none");
                }
            }
            
            this._tbody = domConstruct.create("tbody", {}, this.resultsTable);
            
            this._columnHeaders = [];
            
            for(var i=0; i<this.matriceFields.length; i++) {
                this._columnHeaders[i] = this.matriceFields[i].alias;
                domConstruct.create("th", {innerHTML: this._columnHeaders[i]}, this._headerTr);
            }
                        
            this._addResults(this._results);
            
            if(Has("ie")) {
                Style.set(this.footerDiv, "paddingBottom", "20px");
            }
        },

        _addResults:function(results) {
            if(results && results.length > 0) {
                //rows
                for(var i=0;i<results.length; i++) {
                    var curRes = results[i];
                    if(curRes.layerName == this.PARCEL_LAYERNAME){
                        this._augmentResult(curRes);
                    } else {
                        lang.mixin(this._resultRowWidgetConfig, {
                            _result: results[i],
                            _spwLayer: this._spwLayer,
                            _spwIdentifyResultTable: this
                        });
                        var spwIdentifyResultRow = new this._resultRowWidgetClass(this._resultRowWidgetConfig);
                        
                        domConstruct.place(spwIdentifyResultRow.domNode, this._tbody, "last");
                        this._spwIdentifyResultRows.push(spwIdentifyResultRow);
                    }                
                }
            }
            this.updateFooterText();
        },
       _augmentResult:function(curRes){
            var urbanMapSearhCapakeyUrl = this.urbanRestApiUrl + "/" + "identify_advanced/capakeys/" + curRes.value;
            request(urbanMapSearhCapakeyUrl).then(lang.hitch(this, function(data){
                var jmatrice = JSON.parse(data);
                if(jmatrice.results.length > 0) {
                    var matrice_record = jmatrice.results[0];
                    curRes.feature.attributes = matrice_record;

                    lang.mixin(this._resultRowWidgetConfig, {
                        _result: curRes,
                        _spwLayer: this._spwLayer,
                        _spwIdentifyResultTable: this
                    });
                    var spwIdentifyResultRow = new this._resultRowWidgetClass(this._resultRowWidgetConfig);
                    
                    domConstruct.place(spwIdentifyResultRow.domNode, this._tbody, "last");
                    this._spwIdentifyResultRows.push(spwIdentifyResultRow);
                }
            }));
       } 
	});
});