/*
    merchant operating system (MOS)
    alpha v0.01
    Apache v2 Licence 
    Xingzhong Xu xu@yesgoody.com
    yesgoody inc.
    
    roadmap
    1. data collector supports post and read
        POST /order 
        GET /order
    2. form to trigger the order
        GET /
        POST /
*/

var express = require('express');
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://yesgoody_test:yesgoody2013@ds045137.mongolab.com:45137/heroku_app9889853');
var app = express.createServer();
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/../public'));
app.use(express.bodyParser());

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("mongodb is on");
});

var OrderSchema = new mongoose.Schema({
    utc: Number,
	type: String,
    price : Number,
	data: {
		customerID : Number,
		merchantID : Number,
		details : [{
            item : String,
            num: Number,
        }],
	}
});
var Order = db.model('Order', OrderSchema);

app.get('/', function(request, response) {
    Order.find(function(err, orders){
        if(!err){
			response.render( 'index.jade', {title:"xingzhong", type:"GET"} );
		}
		else{
			return console.log(err);
		}
	});
});

app.post("/", function(request, response){
    var jsonData = JSON.parse(request.param("jsonData"));
    var mongoData = {};
    console.log(jsonData);
    mongoData["utc"] = Date.now();
    mongoData["type"] = "order";
    mongoData["data"] = {};
    jsonData.forEach( function (e, i, a) {
        if (["merchantID", "customerID"].indexOf(e.name)>-1){
            mongoData["data"][e.name] = parseInt( e.value );
        }
        if (["price", "tax"].indexOf(e.name)>-1){
            mongoData[e.name] = parseFloat(e.value);
        }
        if (["details"].indexOf(e.name)>-1){
            var details = []; 
            e.value.split(",")
                .forEach(function(detail){
                    var d = {};
                    d.item = detail.split(":")[0];
                    d.num = detail.split(":")[1];
                    details.push(d);
                });
            mongoData["data"]["details"] = details;
        }
    })
    var order = new Order(mongoData);
    console.log(order)
    order.save(function (err, d) {
        if (!err){ 
            console.log("created!");
            console.log(d);
            response.send(d); 
        }
        else{
            console.log("saving error");
            console.log(err);
        }
	});
});

app.post('/order', function(request, response) {
   request.on("data", function(d){
     var order = new Order(JSON.parse(d));
     order.save(function(err){
         if(!err) {console.log("order created!");}
         else {console.log("order error!");}
     });
   });
});

app.get('/list', function(req, res) {
	return Order.find(function(err, orders){
		if(!err){
			return res.send(orders);
		}
		else{
			return console.log(err);
		}
	});
});

app.get('/remove', function(req, res) {
    var id = req.param("id");
    return Order.findById(id, function(err, orders){
		if(!err){
            console.log(orders);
            orders.remove(function(err){
                if(!err){
                    console.log("remove");
                }
                else{
                    console.log("error remove");
                    console.log(err);
                }
            })
			return res.send(orders);
		}
		else{
			return console.log(err);
		}
	});
});

var testJson = {
	"service":"yesgoody-mos", 
	"version":"alpha",
	"utc":Date.now()};
	
app.post('/api', function(req, res){
	req.on("data", function(d){
		//console.log(d.toString());
		testJson.params = req.params;
		testJson.headers = req.headers;
		testJson.query = req.query;
		testJson.path = req.path;
		testJson.data = JSON.parse(d);
		res.json(testJson);
		var order = new Order(JSON.parse(d));
		order.save(function (err) {
		  if (!err){ console.log("created!");}
		  else{console.log("saving error");}
		});
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
