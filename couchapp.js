var couchapp = require('couchapp')
var path = require('path')

ddoc = 
  { "_id":'_design/mobile_viewer',
    "description": "jQuery mobile app that lets people discover data near their location",
    "name": "Mobile Viewer",
    "rewrites": [
      {
        "to": "/../../*",
        "from": "dbimgs/*"
      },
      {
        "to": "/_list/jsonp/assetid",
        "from": "assetid"
      },
      {
        "to": "index.html",
        "from": "/"
      },
      {
        "to": "details.html",
        "from": "details.html"
      },
      {
        "to": "/_spatial/_list/geojson/full",
        "from": "/data"
      },
      {
        "to": "/_list/jsonp/config",
        "from": "/config"
      },
      {
        "to": "/../../",
        "from": "api"
      },
      {
        "to": "/../../*",
        "from": "api/*"
      }
    ]
  };

ddoc.views = {
  "assetid": {
    map: function(doc) {
      emit(doc._id, doc);
    }
  },
  "attach-count": {
    map: function(doc) {
      if (doc.source =='San Francisco Arts Commission') {
        if (doc._attachments) emit(null, Object.keys(Object(doc._attachments)).length);
      }
    }
  },
  "config": {
    map: function(doc) {
      if(doc.doc_type && doc.doc_type === "config") {
        emit(doc._id, doc);
      }
    }
  },
  "recent-items": {
    map: function(doc) {
      if (doc.created_at) {
        emit(doc.created_at, doc);
      }
    }
  },
  "sfonly": {
    map: function(doc) { 
      if(doc.source =='San Francisco Arts Commission') emit(doc.accession_id, doc);
    }
  }
}

ddoc.spatial = {
  /**
   * A simple spatial view that emits the GeoJSON plus the complete documents.
   */
  full: function(doc) {
    if(doc.geometry) {
      emit(doc.geometry, doc)
    }
  }
}

ddoc.lists = {
  "asset": function(head, req) {
    var row, out, sep = '\n';

    // Send the same Content-Type as CouchDB would
    if (req.headers.Accept.indexOf('application/json')!=-1)
      start({"headers":{"Content-Type" : "application/json"}});
    else
      start({"headers":{"Content-Type" : "text/plain"}});

    if ('callback' in req.query) send(req.query['callback'] + "(");


    while (row = getRow()) {
        out = JSON.stringify(row.value);
        send(out);
    }
    if ('callback' in req.query) send(")");
  },
  /**
   * This function outputs a GeoJSON FeatureCollection (compatible with
   * OpenLayers). The geometry is stored in the geometry property, all other
   * properties in the properties property.
   * 
   * @author Volker Mische
   */
  "geojson": function(head, req) {
    var row, out, sep = '\n';

    // Send the same Content-Type as CouchDB would
    if (typeof(req.headers.Accept) != "undefined" && req.headers.Accept.indexOf('application/json')!=-1)
      start({"headers":{"Content-Type" : "application/json"}});
    else
      start({"headers":{"Content-Type" : "text/plain"}});

    if ('callback' in req.query) send(req.query['callback'] + "(");

    send('{"type": "FeatureCollection", "features":[');
    while (row = getRow()) {
        out = '{"type": "Feature", "id": ' + JSON.stringify(row.id);
        out += ', "geometry": ' + JSON.stringify(row.value.geometry);
        delete row.value.geometry;
        out += ', "properties": ' + JSON.stringify(row.value) + '}';

        send(sep + out);
        sep = ',\n';
    }
    send("]}");
    if ('callback' in req.query) send(")");
  },
  "jsonp": function(head, req) {
    var row, out, sep = '\n';

    // Send the same Content-Type as CouchDB would
    if (req.headers.Accept.indexOf('application/json')!=-1)
      start({"headers":{"Content-Type" : "application/json"}});
    else
      start({"headers":{"Content-Type" : "text/plain"}});

    if ('callback' in req.query) send(req.query['callback'] + "(");


    while (row = getRow()) {
        out = JSON.stringify(row.value);
        send(out);
    }
    if ('callback' in req.query) send(")");
  },
  "sum": function(head, req) {
    var row, out, sum = 0, sep = '\n';

    // Send the same Content-Type as CouchDB would
    if (req.headers.Accept.indexOf('application/json')!=-1)
      start({"headers":{"Content-Type" : "application/json"}});
    else
      start({"headers":{"Content-Type" : "text/plain"}});

    if ('callback' in req.query) send(req.query['callback'] + "(");


    while (row = getRow()) {
        sum += parseFloat(row.value);
    }

    out = JSON.stringify(sum);
    send(out);

    if ('callback' in req.query) send(")");
  }
}


couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;