
require(["spw/api/SpwViewer", "dijit/registry", "dojo/ready", "esri/config"],
    function(SpwViewer, registry, ready, esriConfig){
        ready(function(){
        viewer = SpwViewer.getInstance();
        viewer.placeAt('spwViewerDiv').startup();
        viewer.on('viewerLoaded', function(){
            //viewer && viewer.spwMap && viewer.spwMap.esriMap && viewer.spwMap.esriMap._layers && viewer.spwMap.esriMap._layers.SEMAINE_MOB && viewer.spwMap.esriMap._layers.SEMAINE_MOB.redraw();
            
        });
    });
});