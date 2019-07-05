define(["dojo/_base/declare","spw/widgets/SpwIdentifyResultTable",
 "dojo/dom-construct", "dojo/_base/lang", "dojo/request"],
        function(declare, SpwIdentifyResultTable,
             domConstruct, lang, request){

	return declare("imio.widget.UrbanIdentifyResultTable", [SpwIdentifyResultTable], {
        urbanRestApiUrl : '/urbanmap',
        PARCEL_LAYERNAME : 'Parcelles cadastrales',
        matriceFields : [
            {name: "capakey", type: "esriFieldTypeString", alias: "CAPAKEY", length: 17, domain: null},
            {name: "cadastralincome", type: "esriFieldTypeString", alias: "cadastralincome", length: 17, domain: null},
            {name: "datesituation", type: "esriFieldTypeString", alias: "datesituation", length: 17, domain: null}
        ],
        
        _addResults:function(results) {
            if(results && results.length > 0) {
                //rows
                for(var i=0;i<results.length; i++) {
                    var curRes = results[i];
                    if(curRes.layerName == this.PARCEL_LAYERNAME){
                        this._augmentResult(curRes);
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