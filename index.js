import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import session from "express-session";
import bodyParser from "body-parser";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const port = 5000;

// Connect to Mongo DB
const uri = process.env.MONGO_URI
const client = new MongoClient(uri);
client.connect().then(() => console.log("Connected to Mongo DB"));

// MIDDLEWARES
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
	req.db = client.db("to-do-app");
	next();
}); // Middleware to attach DB to all request bodies
app.use(
	session({
		secret: process.env.SESSION_SECRET_KEY,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			client: client,
			dbName: "to-do-app",
			collectionName: "users",
		}),
		cookie: { secure: false },
	}),
); // Middleware to create a session and store it using mongoStore

// This middlware is to log each request's method and url to the screen
// because for some reason, the login_submit endpoint is being hit twice
// and can't seem to fix it. If you do, kindly lmk. TY
app.use((req, res, next) => {
	console.log(`Request received: ${req.method} ${req.url}`);
	next();
});

// Get project directory name
const filename = fileURLToPath(import.meta.url); // This line converts this files url to a path
const dirname = path.dirname(filename); // This line gets the path to the directory of this file

app.use(express.static("public")); // Serve static files from the'public' directory

app.get("/", (req, res) => {
	res.send("H O M E P A G E");
});

app.get("/signup", (req, res) => {
	res.sendFile(path.join(dirname, "signup.html"));
});

app.post("/on_signup", async (req, res) => {
	const newUser = req.body;

	try {
		if (newUser.name && newUser.email && newUser.password) {
			// Add new user to DB
			const collection = await req.db.collection("users");
			await collection.insertOne(newUser);
			req.session.user = {
				name: newUser.name,
				id: newUser._id,
			};

			console.log("From /on_signup route: Signed up as: ", req.session.user);
			res.redirect("/todo");
		}
	} catch (error) {
		console.log(error);
	}
});

app.get("/login", (req, res) => {
	res.sendFile(path.join(dirname, "login.html"));
});

app.post("/login_submit", async (req, res) => {
	try {
		const { name, password } = req.body; // Destructuring to extract these values from the req body
		const collection = await req.db.collection("users");
		const user = await collection.findOne({ name, password });
		if (user) {
			req.session.user = { name: user.name, id: user._id }; // Adding the user object to the session object
			console.log("Logged in as: ", req.session.user);
			res.redirect("/todo");
		} else {
			res.redirect("/login");
		}
	} catch (error) {
		console.log(error);
	}
});

app.get("/todo", (req, res) => {
	if (!req.session.user) {
		res.redirect("/login");
	} else {
		res.sendFile(path.join(dirname, "index.html"));
	}
});

// ENDPOINT FOR SAVING TASKS TO THE DATABASE
app.post("/save", async (req, res) => {
	const userId = req.session.user.id;
	const data = req.body;
	console.log(data);
	if (!req.session.user) {
		res.send("Unauthorised access");
	}
	try {
		const collection = await req.db.collection("user_data");

		// The updateOne() method checks the DB for the specified userID
		// The $set operator is used to update the 'data' field gotten from the request body
		// The 'upsert' operator creates a new document if the one you're trying to update doesn't exist.
		await collection.updateOne(
			{ userId: userId },
			{ $set: { data: data } },
			{ upsert: true },
		);
		console.log("Data inserted successfully with ID: ", userId);
	} catch (error) {
		console.log(error);
	}
});

// ENDPOINT TO DELETE ALL TASKS FROM THE DB
app.get("/clear", async (req, res) => {
	const userId = req.session.user.id;
	const collection = await req.db.collection("user_data");
	await collection.deleteOne({ userId: userId });
	res.send("All data cleared");
});

// ENDPOINT TO RETRIEVE TASKS FROM THE DB
app.get("/data", async (req, res) => {
	const userId = req.session.user.id;
	const collection = await req.db.collection("user_data");
	const userData = await collection.findOne({ userId: userId });
	if (userData.data) {
		res.json(userData.data);
	}
});

app.listen(port, () => {
	console.log(`Server started on http://localhost:${port}`);
});
