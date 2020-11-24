define(["dojo/_base/declare","spw/widgets/SpwIdentifyResultRow", "dojo/text!./templates/UrbanIdentifyResultRow.html",
 "dojo/dom-construct", "dojo/_base/lang", "dojo/on"],
        function(declare, SpwIdentifyResultRow, template,
             domConstruct, lang, on){

	return declare("imio.widget.UrbanIdentifyResultRow", [SpwIdentifyResultRow], {
        urbanRestApiUrl : '/urbanmap',
        templateString: template,
        postCreate: function() {
            
            //properties
            this._rowValues = new Array();
            

            for (key in this._result.feature.attributes) {
                if(	key.toUpperCase().indexOf("SHAPE") != 0
                    && key.toUpperCase().indexOf("SE_ANNO_CAD_DATA" ) != 0
                    && key.toUpperCase().indexOf("OBJECTID") != 0) {
                        this._rowValues.push(this.nvl(this._result.feature.attributes[key],""));
                        var td = domConstruct.create("td", {innerHTML: this.nvl(this._result.feature.attributes[key],"")}, this.domNode);
                        td.feature = this._result.feature;
                        on(td, "click", lang.hitch(this,this.onRowClick));
                }
            }
            
        }

	});
});