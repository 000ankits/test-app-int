const express = require('express'),
	{ Client } = require('pg'),
	dotenv = require('dotenv'),
	bodyparser = require('body-parser'),
	session = require('express-session'),
	multer = require('multer'),
	app = express();

dotenv.config({ path: './.env' });

const dbConn = new Client({
	connectionString : process.env.DATABASE_URL,
	ssl              : {
		rejectUnauthorized : false
	}
});
dbConn.connect();

app.use(express.static('views'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(session({ secret: 'Password Encryption', resave: false, saveUninitialized: false }));
app.use((req, res, next) => {
	res.locals.currentUser = req.session.username;
	next();
});

const storage = multer.memoryStorage(),
	upload = multer({ storage: storage });

// ===================================
// Routes
// ===================================

app.get('/', (req, res) => {
	const sql = {
		text   : `select * from posts where privacy = $1`,
		values : [ 'public' ]
	};
	dbConn
		.query(sql)
		.then((data) => {
			// data.forEach((row) => {

			// });
			return res.render('home', { posts: data.rows });
		})
		.catch((e) => {
			console.log(e);
			res.end();
			// res.redirect('/');
		});
});

app.get('/login', (req, res) => {
	if (req.session.user) {
		return res.redirect('/message');
	}
	res.render('login');
});

app.post('/login', (req, res) => {
	if (!req.body.username || !req.body.pass) {
		res.redirect('/login');
	} else {
		const sql = {
			text   : `select * from users where username = $1 and password = $2`,
			values : [ req.body.username, req.body.pass ]
		};
		dbConn
			.query(sql)
			.then((data) => {
				// console.log(data);
				req.session.user = req.body.username;
				res.redirect('/myposts');
			})
			.catch((e) => {
				console.log(e);
				res.redirect('/login');
			});
	}
});

app.get('/register', (req, res) => {
	if (req.session.user) {
		return res.redirect('/message');
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
		dbConn
			.query(sql)
			.then((data) => {
				// console.log(data);
				return res.redirect('/login');
			})
			.catch((e) => {
				console.log(e);
				return res.redirect('/register');
			});
	}
});

app.get('/myposts', (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login');
	}
	const sql = {
		text   : `select * from posts where username = $1`,
		values : [ req.session.user ]
	};
	dbConn
		.query(sql)
		.then((data) => {
			// data.forEach((row) => {

			// });
			return res.render('myPosts', { posts: data.rows });
		})
		.catch((e) => {
			console.log(e);
			res.redirect('/');
		});
});

app.get('/createPost', (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login');
	}
	res.render('createPost');
});

app.post('/createPost', (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login');
	}
	if (!req.body.title || !req.body.privacy) {
		return res.redirect('/createPost');
	}

	const sql = {
		text   : `insert into posts (username, title, imglink, description, privacy) values($1, $2, $3, $4, $5)`,
		values : [ req.session.user, req.body.title, req.body.img, req.body.description, req.body.privacy ]
	};
	dbConn.query(sql, (err, result) => {
		if (err) {
			console.log(err);
			return res.redirect('/createPost');
		} else {
			console.log('success!');
			return res.redirect('/myposts');
		}
	});
	// dbConn
	// 	.query(sql)
	// 	.then((data) => {
	// 		console.log('success!');
	// 		return res.redirect('/myposts');
	// 	})
	// 	.catch((e) => {
	// 		console.log(e);
	// 		return res.redirect('/');
	// 	});
	// res.redirect('/login');
});

app.get('/message', (req, res) => {
	res.render('message', { message: 'You are already logged in' });
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});

dbConn.on('error', (err) => {
	console.log(err);
});

const port = process.env.PORT || 8888;
app.listen(port, () => {
	console.log('Server started on ', port);
});
