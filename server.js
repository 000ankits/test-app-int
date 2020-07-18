const express = require('express'),
	{ Client } = require('pg'),
	dotenv = require('dotenv'),
	bodyparser = require('body-parser'),
	session = require('express-session'),
	multer = require('multer'),
	app = express();

dotenv.config({ path: './.env' });

const dbConn = new Client({
	connectionString : process.env.DBURL,
	ssl              : {
		rejectUnauthorized : false
	}
});

app.use(express.static('views'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({ secret: 'Password Encryption', resave: false, saveUninitialized: false }));

const storage = multer.memoryStorage(),
	upload = multer({ storage: storage });

// ===================================
// Routes
// ===================================

app.get('/', (req, res) => {
	res.render('home');
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.post('/login', (req, res) => {
	if (req.session.user) {
		req.session.message = 'You are already logged in';
		res.redirect('/message');
	}
	if (!req.body.username || !req.body.pass) {
		res.redirect('/login');
	} else {
		const sql = {
			text   : `select * from users where username = $1 and password = $2`,
			values : [ req.body.username, req.body.pass ]
		};
		dbConn.connect();
		dbConn
			.query(sql)
			.then((data) => {
				console.log(data);
				dbConn.end();
				req.session.user = req.body.username;
				res.redirect('/posts');
			})
			.catch((e) => {
				console.log(e);
				dbConn.end();
				res.redirect('/login');
			});
	}
});

app.get('/register', (req, res) => {
	if (req.session.user) {
		req.session.message = 'You are already registered';
		res.redirect('/message');
	}
	if (req.session) res.render('register');
});

app.post('/register', (req, res) => {
	if (
		!req.body.username ||
		!req.body.email ||
		!req.body.pass ||
		!req.body.c_pass ||
		req.body.pass !== req.body.c_pass
	) {
		console.log('querry halted');
		res.redirect('/register');
	} else {
		console.log('querry started');
		const sql = {
			text   : `insert into users(username, email, password) values($1, $2, crypt( $3, gen_salt('bf')))`,
			values : [ req.body.username, req.body.email, req.body.pass ]
		};
		dbConn.connect();
		dbConn
			.query(sql)
			.then((data) => {
				console.log(data);
				dbConn.end();
				res.redirect('/login');
			})
			.catch((e) => {
				console.log(e);
				dbConn.end();
				res.redirect('/register');
			});
	}
});

app.get('/posts', (req, res) => {
	if (!req.session.user) {
		res.redirect('/login');
	}
	res.send('you have posts');
});

app.get('/message', (req, res) => {
	res.render('message', { message: req.session.message });
	req.session.message = '';
});

const port = process.env.PORT || 8888;
app.listen(port, () => {
	console.log('Server started on ', port);
});
