var r = require('rethinkdb');


// #### Connection details

// RethinkDB database settings. Defaults can be overridden using environment variables.
var dbConfig = {
  host: process.env.RDB_HOST || 'localhost',
  port: parseInt(process.env.RDB_PORT) || 28015,
  db  : process.env.RDB_DB || 'waterbase',
  tables: {
    'wb_chatApp': 'id'
  }
};


module.exports.setup = function() {
  r.connect({host: dbConfig.host, port: dbConfig.port }, function (err, connection) {
    r.dbCreate(dbConfig.db).run(connection, function(err, result) {
      if(err) {
        console.log("[DEBUG] RethinkDB database '%s' already exists (%s:%s)\n%s", dbConfig.db, err.name, err.msg, err.message);
      }
      else {
        console.log("[INFO ] RethinkDB database '%s' created", dbConfig.db);
      }

      for(var tbl in dbConfig.tables) {
        (function (tableName) {
          r.db(dbConfig.db).tableCreate(tableName, {primaryKey: dbConfig.tables[tbl]}).run(connection, function(err, result) {
            if(err) {
              console.log("[DEBUG] RethinkDB table '%s' already exists (%s:%s)\n%s", tableName, err.name, err.msg, err.message);
            }
            else {
              console.log("[INFO ] RethinkDB table '%s' created", tableName);
            }
          });
        })(tbl);
      }
    });
  });
};
module.exports.saveMessage = function (msg, callback) {
  onConnect(function (err, connection) {
    r.db(dbConfig['db']).table('wb_chatApp').insert(msg).run(connection, function(err, result) {
      if(err) {
        console.log("[ERROR][%s][saveMessage] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
        callback(err);
      }
      else {
        if(result.inserted === 1) {
          callback(null, true);
        }
        else {
          callback(null, false);
        }
      }
      connection.close();
    });
  });
};

module.exports.getAllMessage = function (max_results, callback) {
  onConnect(function (err, connection) {
    r.db(dbConfig['db']).table('wb_chatApp').orderBy(r('timestamp')).limit(max_results).run(connection, function(err, cursor) {
      if(err) {
        console.log("[ERROR][%s][findMessages] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
        callback(null, []);
        connection.close();
      }
      else {
        cursor.toArray(function(err, results) {
          if(err) {
            console.log("[ERROR][%s][findMessages][toArray] %s:%s\n%s", connection['_id'], err.name, err.msg, err.message);
            callback(null, []);
          }
          else {
            callback(null, results);
          }
          connection.close();
        });
      }
    });
  });
};

function onConnect(callback) {
  r.connect({
    host: dbConfig.host,
    port: dbConfig.port
  }, function(err, connection) {
    connection['_id'] = Math.floor(Math.random() * 10001);
    callback(err, connection);
  });
}