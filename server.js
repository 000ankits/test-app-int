const express = require('express'),
	{ Client } = require('pg'),
	dotenv = require('dotenv'),
	app = express();

dotenv.config({ path: './.env' });

const dbConn = new Client({
	connectionString : process.env.DBURL,
	ssl              : {
		rejectUnauthorized : false
	}
});

app.use(express.static('public'));
app.use(express.static('views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	res.send('Hello');
});

const port = process.env.PORT || 8888;
app.listen(port, () => {
	console.log('Server started on ', port);
});
